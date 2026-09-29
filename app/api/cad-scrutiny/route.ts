import { NextRequest, NextResponse } from "next/server";
import { evaluateCadSetback, CadScrutinyRequest } from "@/lib/cadScrutinyService";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.plotBoundary || !body.equipmentLocation) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required layout geometry: 'plotBoundary' and 'equipmentLocation' are required.",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const report = evaluateCadSetback(body as CadScrutinyRequest);

    return NextResponse.json(
      {
        success: true,
        data: report,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
