import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError, ApiError } from "@/lib/api-error";
import Scheme from "@/models/Scheme";
import { seedSchemes } from "@/lib/seedSchemes";

export const dynamic = "force-dynamic";

/**
 * GET /api/schemes - Fetch sector-scoped government incentive schemes
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new ApiError("Authentication required to view recommended statutory schemes.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const requestedSector = searchParams.get("sector");

    const validSectors = ["Boiler", "Pollution", "FactoryLicense"];
    const targetSector = (
      requestedSector && validSectors.includes(requestedSector)
        ? requestedSector
        : session.sector || "Boiler"
    ) as "Boiler" | "Pollution" | "FactoryLicense";

    await connectToDatabase();
    await seedSchemes();

    const schemes = await Scheme.find({ sector: targetSector, isActive: true }).lean();

    return NextResponse.json({
      success: true,
      data: {
        sector: targetSector,
        userSector: session.sector,
        count: schemes.length,
        schemes,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
