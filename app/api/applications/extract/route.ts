import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { validateDocumentBuffer } from "@/lib/documentGuard";
import { extractApplicationDataFromBuffer } from "@/lib/applicationExtractor";

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

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing file in upload request.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Validate file format & integrity
    const guardResult = validateDocumentBuffer(buffer, file.type, file.name);
    if (!guardResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: guardResult.error,
          errorType: guardResult.errorType,
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    // 2. Dual-Layer Extraction (PDF Text Layer vs Tesseract OCR)
    const extractionResult = await extractApplicationDataFromBuffer(buffer, file.type, file.name);

    return NextResponse.json(
      {
        success: true,
        data: extractionResult,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
