import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DocumentModel from "@/models/Document";
import Application from "@/models/Application";
import EntrepreneurProfile from "@/models/EntrepreneurProfile";
import SectorRoadmap from "@/models/SectorRoadmap";
import AuditLog from "@/models/AuditLog";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { validateDocumentBuffer } from "@/lib/documentGuard";
import { processDocumentOCR } from "@/lib/ocrProcessor";
import { verifyDocumentFields } from "@/lib/verificationEngine";
import { verifyDocumentRagCompliance } from "@/lib/rag/documentRagVerifier";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession();
    if (!userPayload || userPayload.role !== "entrepreneur") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Entrepreneur session required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;
    const documentType = (formData.get("documentType") as any) || "OTHER";

    if (!file || !applicationId) {
      return NextResponse.json(
        { success: false, error: "Missing required file or applicationId in form data.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const application = await Application.findOne({
      _id: applicationId,
      applicantId: userPayload.userId,
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found or unauthorized.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Client & Server-side Upload Guard & Magic Bytes Header Check
    const guardResult = validateDocumentBuffer(buffer, file.type, file.name);

    if (!guardResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: guardResult.error,
          errorType: guardResult.errorType,
          code: guardResult.errorType === "SANITY_ERROR" ? "CORRUPTED_FILE" : "VALIDATION_FAILED",
        },
        { status: guardResult.errorType === "SANITY_ERROR" ? 422 : 400 }
      );
    }

    // Fetch Entrepreneur Profile for cross-match verification
    const profile = await EntrepreneurProfile.findOne({ userId: userPayload.userId }).lean();

    let ocrResult: any;
    let verification: any;
    let ragResult: any;

    try {
      console.log(`[Document Pipeline] Starting verification pipeline for applicationId "${applicationId}", docType "${documentType}", file "${file.name}"`);

      const pipelinePromise = (async () => {
        // Step 1: Server-side OCR Processor
        console.log(`[Document Pipeline Step 1/3] Running Tesseract OCR Processor...`);
        const ocr = await processDocumentOCR(buffer, documentType);
        console.log(`[Document Pipeline Step 1/3 Complete] OCR Confidence: ${ocr.ocrConfidence}%, Extracted text length: ${ocr.ocrText.length} chars`);

        // Step 2: Hard Gate Layer 1: Verification Engine (Hard Rules)
        console.log(`[Document Pipeline Step 2/3] Running Hard Rules Verification Engine...`);
        const ver = verifyDocumentFields(
          documentType,
          ocr.extractedFields,
          profile
            ? {
                companyName: profile.companyName,
                registeredAddress: profile.registeredAddress,
                pan: profile.pan,
                gstin: profile.gstin,
              }
            : undefined
        );
        console.log(`[Document Pipeline Step 2/3 Complete] Hard Rules Passed: ${ver.passed}, Failures: ${ver.failures.length}`);

        // Step 3: Hard Gate Layer 2: RAG Statutory Compliance Check
        console.log(`[Document Pipeline Step 3/3] Running Pinecone + Groq RAG Compliance Check...`);
        const rag = await verifyDocumentRagCompliance(application.sector, documentType, ocr.ocrText);
        console.log(`[Document Pipeline Step 3/3 Complete] RAG Compliant: ${rag.compliant}, Model Used: ${rag.modelUsed}`);

        return { ocr, ver, rag };
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Document verification pipeline timed out after 25 seconds")), 25000)
      );

      const result = await Promise.race([pipelinePromise, timeoutPromise]);
      ocrResult = result.ocr;
      verification = result.ver;
      ragResult = result.rag;
    } catch (pipelineErr: any) {
      console.error(`[Document Pipeline Execution Error]:`, pipelineErr.message);
      ocrResult = { ocrText: "", ocrConfidence: 50, extractedFields: { lowConfidenceFields: [] } };
      verification = {
        passed: false,
        failures: [`Verification timed out or failed: ${pipelineErr.message}. Please retry uploading.`],
      };
      ragResult = {
        compliant: false,
        missing_elements: ["Verification timed out during statutory analysis."],
        reasoning: `Pipeline processing error: ${pipelineErr.message}`,
        retrievedRules: [],
        modelUsed: "pipeline-timeout-fallback",
      };
    }

    // Combined dual-layer hard gate pass condition
    const isOverallPassed = verification.passed && ragResult.compliant;
    const combinedFailures = [
      ...verification.failures,
      ...ragResult.missing_elements.map((m: string) => `[RAG Rule Check] Missing: ${m}`),
    ];

    // Save or update Document record for this application and documentType slot
    const docRecord = await DocumentModel.findOneAndUpdate(
      { applicationId: application._id, documentType },
      {
        applicationId: application._id,
        applicantId: userPayload.userId,
        documentType,
        fileName: file.name,
        fileSize: buffer.length,
        mimeType: file.type,
        fileBufferBase64: buffer.toString("base64"),
        ocrText: ocrResult.ocrText,
        ocrConfidence: ocrResult.ocrConfidence,
        extractedFields: ocrResult.extractedFields,
        ragVerification: {
          compliant: ragResult.compliant,
          missingElements: ragResult.missing_elements,
          reasoning: ragResult.reasoning,
          retrievedRules: ragResult.retrievedRules,
        },
        verificationStatus: isOverallPassed ? "PASSED" : "FAILED",
        verificationFailures: combinedFailures,
        verifiedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Hard Gate Application Status Logic & Required Count Enforcement
    // Required slots count for any sector is ALWAYS 4 slots (PAN_CARD, GSTIN_CERTIFICATE, SITE_PLAN, SAFETY_NOC)
    const REQUIRED_SLOT_TYPES = ["PAN_CARD", "GSTIN_CERTIFICATE", "SITE_PLAN", "SAFETY_NOC"];
    const requiredCount = REQUIRED_SLOT_TYPES.length;

    const allDocs = await DocumentModel.find({ applicationId: application._id }).lean();
    const hasAnyFailedDoc = allDocs.some((d) => d.verificationStatus === "FAILED");
    const passedDocsCount = allDocs.filter((d) => d.verificationStatus === "PASSED").length;
    const allFailures = Array.from(new Set(allDocs.flatMap((d) => d.verificationFailures || [])));

    if (hasAnyFailedDoc) {
      application.status = "RETURNED_TO_APPLICANT";
      application.verificationFailures = allFailures;
    } else if (passedDocsCount === requiredCount) {
      // Auto-promote application to READY_FOR_REVIEW ONLY when ALL required document slots pass
      if (application.status !== "APPROVED") {
        application.status = "READY_FOR_REVIEW";
      }
      application.verificationFailures = [];
    } else {
      // If incomplete (e.g. 1 of 4 uploaded), status MUST remain PENDING
      if (application.status !== "APPROVED" && application.status !== "UNDER_REVIEW") {
        application.status = "PENDING";
      }
      application.verificationFailures = [];
    }

    await application.save();

    // 6. Statutory Audit Logging
    await AuditLog.create({
      action: "DOCUMENT_VERIFIED",
      performedBy: userPayload.userId,
      userEmail: userPayload.email,
      role: userPayload.role,
      sector: application.sector,
      targetId: docRecord._id.toString(),
      details: {
        documentType,
        fileName: file.name,
        verificationStatus: docRecord.verificationStatus,
        applicationStatus: application.status,
        hardRulePassed: verification.passed,
        ragCompliant: ragResult.compliant,
        failures: combinedFailures,
        ocrConfidence: ocrResult.ocrConfidence,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          document: docRecord,
          applicationStatus: application.status,
          verification: {
            passed: isOverallPassed,
            hardRulePassed: verification.passed,
            ragCompliant: ragResult.compliant,
            failures: combinedFailures,
            ocrConfidence: ocrResult.ocrConfidence,
            extractedFields: ocrResult.extractedFields,
          },
          ragVerification: {
            compliant: ragResult.compliant,
            missingElements: ragResult.missing_elements,
            reasoning: ragResult.reasoning,
            retrievedRules: ragResult.retrievedRules,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
