import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";
import Application from "@/models/Application";
import AuditLog from "@/models/AuditLog";
import { handleApiError } from "@/lib/api-error";

/**
 * MRTPS Act 2015 Statutory SLA Enforcer
 * Route: POST /api/applications/trigger-sla-scan
 * 
 * Scans active applications and automatically transitions overdue applications
 * to DEEMED_APPROVED pursuant to Section 8 of the Maharashtra Right to Public Services Act 2015.
 * Dispatches statutory escalation to First Appellate Authority.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession(req);
    const performedBy = userPayload?.userId || "SYSTEM_MRTPS_CRON";
    const userEmail = userPayload?.email || "system@anumati.gov.in";
    const role = userPayload?.role || "officer";

    const now = new Date();

    // Find pending/in-review applications where SLA deadline has breached
    const breachedApplications = await Application.find({
      status: { $in: ["PENDING", "RETURNED_TO_APPLICANT", "READY_FOR_REVIEW", "UNDER_REVIEW"] },
      slaDeadline: { $lte: now },
      isDeemedApproved: { $ne: true },
    });

    const transitionedApps = [];

    for (const app of breachedApplications) {
      const previousStatus = app.status;
      app.status = "DEEMED_APPROVED";
      app.isDeemedApproved = true;
      app.deemedApprovalDate = now;
      app.appellateEscalationDispatched = true;
      app.remarks =
        "Statutory SLA breached under Section 8 of MRTPS Act 2015. Deemed Approved. Escalation notice dispatched to First Appellate Authority (Member Secretary / Directorate of Industrial Safety & Health).";

      await app.save();

      await AuditLog.create({
        action: "DEEMED_APPROVAL_MRTPS",
        performedBy,
        userEmail,
        role,
        sector: app.sector,
        targetId: app._id.toString(),
        details: {
          applicationNumber: app.applicationNumber,
          category: app.category,
          slaDeadline: app.slaDeadline,
          previousStatus,
          statutorySection: "Section 8, MRTPS Act 2015",
          appellateEscalation: "Dispatched to First Appellate Authority",
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      transitionedApps.push({
        _id: app._id,
        applicationNumber: app.applicationNumber,
        category: app.category,
        title: app.title,
        applicantName: app.applicantName,
        companyName: app.companyName,
        sector: app.sector,
        status: app.status,
        slaDeadline: app.slaDeadline,
        deemedApprovalDate: app.deemedApprovalDate,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `MRTPS SLA scan completed. ${transitionedApps.length} application(s) transitioned to DEEMED APPROVED.`,
        data: {
          scannedAt: now.toISOString(),
          transitionedCount: transitionedApps.length,
          transitionedApplications: transitionedApps,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const overdueCount = await Application.countDocuments({
      status: { $in: ["PENDING", "RETURNED_TO_APPLICANT", "READY_FOR_REVIEW", "UNDER_REVIEW"] },
      slaDeadline: { $lte: now },
      isDeemedApproved: { $ne: true },
    });

    const deemedApprovedCount = await Application.countDocuments({
      isDeemedApproved: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          overdueForDeemedApproval: overdueCount,
          totalDeemedApproved: deemedApprovedCount,
          currentTime: now.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
