import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";
import Application from "@/models/Application";
import DocumentModel from "@/models/Document";
import { handleApiError } from "@/lib/api-error";

/**
 * Route: GET /api/applications/[id]/certificate
 * Generates cryptographic clearance certificate metadata for APPROVED or DEEMED_APPROVED clearances.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession(req);
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id } = params;
    const application = await Application.findById(id).lean();

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Role check: Only applicant or officers can view certificate
    if (userPayload.role === "entrepreneur" && application.applicantId.toString() !== userPayload.userId) {
      return NextResponse.json(
        { success: false, error: "Access denied to this certificate", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const isDeemed = application.status === "DEEMED_APPROVED" || application.isDeemedApproved;
    const isApproved = application.status === "APPROVED";

    if (!isApproved && !isDeemed) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificate is only available for Approved or Deemed Approved applications.",
          code: "PRECONDITION_FAILED",
        },
        { status: 400 }
      );
    }

    const approvalDate = isDeemed
      ? application.deemedApprovalDate || application.updatedAt || application.createdAt
      : application.updatedAt || application.createdAt;

    const certPrefix = isDeemed ? "DEEMED" : "CERT";
    const certNumber = `${certPrefix}-${application.applicationNumber}`;

    // Cryptographic SHA-256 hash for tamper-evident verification
    const hashPayload = [
      application.applicationNumber,
      application.companyName,
      application.sector,
      application.category || "Orange",
      isDeemed ? "DEEMED_APPROVED" : "APPROVED",
      new Date(approvalDate).toISOString(),
      "ANUMATI-GOV-IN-VERIFIED",
    ].join("|");

    const digitalHash = crypto.createHash("sha256").update(hashPayload).digest("hex").toUpperCase();

    // Fetch verified documents list
    const verifiedDocs = await DocumentModel.find({
      applicationId: application._id,
      verificationStatus: "PASSED",
    })
      .select("documentType fileName verifiedAt")
      .lean();

    const authorityName = isDeemed
      ? "First Appellate Authority & State Public Services Commission (MRTPS Act 2015)"
      : application.sector === "Boiler"
      ? "Directorate of Steam Boilers, Department of Labour"
      : application.sector === "Pollution"
      ? "State Pollution Control Board (Water & Air Pollution Acts)"
      : "Directorate of Industrial Safety & Health (Factories Act 1948)";

    const legalCitation = isDeemed
      ? "Statutory Deemed Approval accorded under Section 8 of the Maharashtra Right to Public Services Act, 2015, read with Government Resolution No. DIC-2020/CR-78/IND-2 (Maha Parwana Initiative)."
      : application.sector === "Boiler"
      ? "Issued under Indian Boilers Act, 1923 (Act No. 5 of 1923), Section 7 and Indian Boiler Regulations 1950."
      : application.sector === "Pollution"
      ? "Issued under Section 25 of the Water (Prevention and Control of Pollution) Act, 1974 & Section 21 of Air Act, 1981."
      : "Issued under Section 6 of the Factories Act, 1948 and State Factory Rules.";

    return NextResponse.json(
      {
        success: true,
        data: {
          certificateNumber: certNumber,
          applicationNumber: application.applicationNumber,
          applicantName: application.applicantName,
          companyName: application.companyName,
          sector: application.sector,
          category: application.category || "Orange",
          plantLocation: application.plantLocation,
          estimatedBudget: application.estimatedBudget,
          status: isDeemed ? "DEEMED_APPROVED" : "APPROVED",
          isDeemedApproved: isDeemed,
          approvalDate,
          expiryDate: new Date(new Date(approvalDate).getTime() + 5 * 365 * 24 * 3600 * 1000).toISOString(),
          authorityName,
          legalCitation,
          digitalSignatureHash: digitalHash,
          verifiedDocuments: verifiedDocs,
          statutoryConditions: [
            "The clearance is non-transferable and holds validity across designated plant coordinates only.",
            "All statutory environmental emission norms, boiler operating pressure limits, and worker safety provisions must be maintained continuously.",
            "Authorized government regulatory inspectors reserve unhindered access for periodic compliance auditing.",
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
