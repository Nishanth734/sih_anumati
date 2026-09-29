import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import EntrepreneurProfile from "@/models/EntrepreneurProfile";
import DocumentModel from "@/models/Document";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { calculateFuzzySimilarity } from "@/lib/verificationEngine";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession();
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const application = await Application.findById(params.id).lean();

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Verify sector match for officers
    if (userPayload.role === "officer" && userPayload.sector !== application.sector) {
      return NextResponse.json(
        {
          success: false,
          error: `Access Denied: You are assigned to sector ${userPayload.sector}, but this application belongs to ${application.sector}.`,
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // Verify applicant match for entrepreneurs
    if (userPayload.role === "entrepreneur" && application.applicantId.toString() !== userPayload.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to application", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Fetch Entrepreneur Profile & Uploaded Documents
    const profile = await EntrepreneurProfile.findOne({ userId: application.applicantId }).lean();
    const documents = await DocumentModel.find({ applicationId: application._id }).lean();

    // Recompute real-time Application Status from document verification states
    const REQUIRED_SLOT_TYPES = ["PAN_CARD", "GSTIN_CERTIFICATE", "SITE_PLAN", "SAFETY_NOC"];
    const requiredCount = REQUIRED_SLOT_TYPES.length;
    const hasAnyFailedDoc = documents.some((d) => d.verificationStatus === "FAILED");
    const passedCount = documents.filter((d) => d.verificationStatus === "PASSED").length;

    let computedStatus = application.status;
    if (hasAnyFailedDoc) {
      computedStatus = "RETURNED_TO_APPLICANT";
    } else if (passedCount === requiredCount) {
      if (application.status !== "APPROVED") {
        computedStatus = "READY_FOR_REVIEW";
      }
    } else if (application.status !== "APPROVED" && application.status !== "UNDER_REVIEW") {
      computedStatus = "PENDING";
    }

    application.status = computedStatus;

    // Aggregate extracted OCR data across documents
    let extractedName = "";
    let extractedPan = "";
    let extractedGstin = "";
    let extractedAddress = "";
    let overallOcrConfidence = 100;

    documents.forEach((doc) => {
      if (doc.extractedFields?.name && !extractedName) extractedName = doc.extractedFields.name;
      if (doc.extractedFields?.pan && !extractedPan) extractedPan = doc.extractedFields.pan;
      if (doc.extractedFields?.gstin && !extractedGstin) extractedGstin = doc.extractedFields.gstin;
      if (doc.extractedFields?.address && !extractedAddress) extractedAddress = doc.extractedFields.address;
      if (doc.ocrConfidence && doc.ocrConfidence < overallOcrConfidence) {
        overallOcrConfidence = doc.ocrConfidence;
      }
    });

    const submittedCompanyName = profile?.companyName || application.companyName || "";
    const submittedPan = profile?.pan || "";
    const submittedGstin = profile?.gstin || "";
    const submittedAddress = profile?.registeredAddress || application.plantLocation || "";

    const comparisons = [];

    // Company / Firm Name Comparison
    if (submittedCompanyName || extractedName) {
      const nameSim = calculateFuzzySimilarity(submittedCompanyName, extractedName);
      const isExact = submittedCompanyName.toLowerCase().trim() === extractedName.toLowerCase().trim();
      comparisons.push({
        fieldName: "Company / Firm Name",
        submittedValue: submittedCompanyName || "Not Specified",
        ocrExtractedValue: extractedName || "Not Extracted",
        similarityScore: Math.round(nameSim * 100),
        isMatch: isExact,
        isNearThresholdMismatch: !isExact && nameSim >= 0.7 && nameSim < 1.0,
      });
    }

    // PAN Number Comparison
    if (submittedPan || extractedPan) {
      const isExact = submittedPan.toUpperCase().trim() === extractedPan.toUpperCase().trim();
      comparisons.push({
        fieldName: "Business Tax PAN",
        submittedValue: submittedPan || "Not Specified",
        ocrExtractedValue: extractedPan || "Not Extracted",
        similarityScore: isExact ? 100 : 0,
        isMatch: isExact,
        isNearThresholdMismatch: !isExact && extractedPan.length > 0,
      });
    }

    // GSTIN / Udyam Comparison
    if (submittedGstin || extractedGstin) {
      const isExact = submittedGstin.toUpperCase().trim() === extractedGstin.toUpperCase().trim();
      comparisons.push({
        fieldName: "GSTIN / Udyam Registration",
        submittedValue: submittedGstin || "Not Specified",
        ocrExtractedValue: extractedGstin || "Not Extracted",
        similarityScore: isExact ? 100 : 0,
        isMatch: isExact,
        isNearThresholdMismatch: !isExact && extractedGstin.length > 0,
      });
    }

    // Registered Address Comparison
    if (submittedAddress || extractedAddress) {
      const addrSim = calculateFuzzySimilarity(submittedAddress, extractedAddress);
      const isExact = submittedAddress.toLowerCase().trim() === extractedAddress.toLowerCase().trim();
      comparisons.push({
        fieldName: "Registered Unit Address",
        submittedValue: submittedAddress || "Not Specified",
        ocrExtractedValue: extractedAddress || "Not Extracted",
        similarityScore: Math.round(addrSim * 100),
        isMatch: isExact,
        isNearThresholdMismatch: !isExact && addrSim >= 0.55 && addrSim < 1.0,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          application,
          profile,
          documents,
          overallOcrConfidence,
          comparisons,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
