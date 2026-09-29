import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SectorRoadmap from "@/models/SectorRoadmap";
import Application from "@/models/Application";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    let requestedSector = searchParams.get("sector") as "Boiler" | "Pollution" | "FactoryLicense" | null;

    const userPayload = await getCurrentUserSession();

    // Default to user's sector if no sector is explicitly provided in query
    if (!requestedSector && userPayload?.sector) {
      requestedSector = userPayload.sector;
    }

    if (!requestedSector) {
      requestedSector = "Boiler"; // Default fallback sector
    }

    const roadmap = await SectorRoadmap.findOne({ sector: requestedSector }).lean();

    if (!roadmap) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          sector: requestedSector,
          message: `No roadmap configured for sector '${requestedSector}' yet.`,
        },
        { status: 200 }
      );
    }

    let userProgress = {
      completedStepNumbers: [] as number[],
      currentStepNumber: 1,
      totalSteps: roadmap.orderedSteps.length,
      applicationsCount: 0,
      activeApplicationStatus: null as string | null,
    };

    if (userPayload?.userId && userPayload.role === "entrepreneur") {
      const userApps = await Application.find({
        applicantId: userPayload.userId,
        sector: requestedSector,
      })
        .sort({ createdAt: 1 })
        .lean();

      userProgress.applicationsCount = userApps.length;

      const approvedApps = userApps.filter((app) => app.status === "APPROVED");
      const approvedCount = approvedApps.length;

      // Completed steps correspond to approved applications
      const completedSteps = Array.from({ length: approvedCount }, (_, i) => i + 1);
      userProgress.completedStepNumbers = completedSteps;

      // Current step is the step after all approved ones (or max step number)
      userProgress.currentStepNumber = Math.min(approvedCount + 1, roadmap.orderedSteps.length || 1);

      // Check if there is an active pending/in-review application for the current step
      const pendingOrReviewApp = userApps.find(
        (app) => app.status === "PENDING" || app.status === "UNDER_REVIEW" || app.status === "ADDITIONAL_INFO_REQUIRED"
      );
      if (pendingOrReviewApp) {
        userProgress.activeApplicationStatus = pendingOrReviewApp.status;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...roadmap,
          userProgress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
