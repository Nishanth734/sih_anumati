import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import AuditLog from "@/models/AuditLog";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession();
    if (!userPayload || userPayload.role !== "officer") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only designated government officers can issue statutory clearance decisions.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, remarks, reason } = body;
    const finalReason = (reason || remarks || "").trim();

    if (!["APPROVED", "REJECTED", "UNDER_REVIEW", "ADDITIONAL_INFO_REQUIRED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status decision code.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // MANDATORY REJECTION REASON ENFORCEMENT
    if (status === "REJECTED" && (!finalReason || finalReason.length < 5)) {
      return NextResponse.json(
        {
          success: false,
          error: "Mandatory Rejection Reason Missing: You must provide a specific statutory reason when refusing clearance.",
          code: "REASON_REQUIRED",
        },
        { status: 400 }
      );
    }

    const application = await Application.findById(params.id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Ensure officer's sector matches application sector
    if (userPayload.sector !== application.sector) {
      return NextResponse.json(
        {
          success: false,
          error: `Sector Mismatch: You are assigned to ${userPayload.sector}, but this application belongs to ${application.sector}.`,
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const prevStatus = application.status;
    application.status = status as any;
    if (finalReason) {
      application.remarks = finalReason;
    }
    application.assignedOfficerId = userPayload.userId as any;
    await application.save();

    // AUDIT LOG COMMIT
    const auditAction =
      status === "APPROVED"
        ? "APPLICATION_APPROVED"
        : status === "REJECTED"
        ? "APPLICATION_REJECTED"
        : "APPLICATION_STATUS_CHANGED";

    await AuditLog.create({
      action: auditAction,
      performedBy: userPayload.userId,
      userEmail: userPayload.email,
      role: userPayload.role,
      sector: userPayload.sector,
      targetId: application._id.toString(),
      details: {
        applicationNumber: application.applicationNumber,
        previousStatus: prevStatus,
        newStatus: status,
        decision: status,
        reason: finalReason,
        timestamp: new Date(),
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      {
        success: true,
        data: { application },
        message: `Application ${application.applicationNumber} status successfully updated to ${status}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
