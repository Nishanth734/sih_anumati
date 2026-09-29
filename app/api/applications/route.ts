import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import AuditLog from "@/models/AuditLog";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { CreateApplicationSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession();
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;
    const statusFilter = searchParams.get("status") || "";

    const query: any = {};

    if (userPayload.role === "entrepreneur") {
      query.applicantId = userPayload.userId;
    } else {
      // Hard Gate Query Enforcement for Officers:
      // Officer query STRICTLY restricts to officer's sector AND verified review statuses
      query.sector = userPayload.sector;
      query.status = {
        $in: ["READY_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "REJECTED", "ADDITIONAL_INFO_REQUIRED"],
      };
    }

    // Apply optional status filter if provided
    if (statusFilter && statusFilter !== "ALL") {
      if (userPayload.role === "officer") {
        // Enforce that officers cannot bypass review filter
        if (["READY_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "REJECTED", "ADDITIONAL_INFO_REQUIRED"].includes(statusFilter)) {
          query.status = statusFilter;
        }
      } else {
        query.status = statusFilter;
      }
    }

    // Apply Search Filter (Applicant Name, Company Name, App Number, Title)
    if (search) {
      query.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting map
    const sortOptions: any = {};
    if (["createdAt", "applicantName", "estimatedBudget", "companyName"].includes(sortBy)) {
      sortOptions[sortBy] = sortOrder;
    } else {
      sortOptions.createdAt = -1;
    }

    const total = await Application.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          applications,
          pagination: {
            total,
            page,
            limit,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userPayload = await getCurrentUserSession(req);
    if (!userPayload || userPayload.role !== "entrepreneur") {
      return NextResponse.json(
        { success: false, error: "Only entrepreneurs can submit clearance applications", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body provided.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing required application data.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Check required fields before Zod validation to surface specific 400 messages
    const requiredFields = ["title", "sector", "description", "estimatedBudget", "plantLocation"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}`, code: "BAD_REQUEST" },
          { status: 400 }
        );
      }
    }

    const validatedData = CreateApplicationSchema.parse(body);
    const submissionMethod = ["PDF_TEXT_EXTRACTION", "OCR", "MANUAL"].includes(body.submissionMethod)
      ? body.submissionMethod
      : "MANUAL";

    const count = await Application.countDocuments();
    const seq = (count + 1).toString().padStart(4, "0");
    const applicationNumber = `ANM-${validatedData.sector.toUpperCase()}-${new Date().getFullYear()}-${seq}`;

    const newApplication = await Application.create({
      applicationNumber,
      applicantId: userPayload.userId,
      applicantName: userPayload.name,
      companyName: userPayload.companyName || userPayload.name,
      sector: validatedData.sector,
      title: validatedData.title,
      description: validatedData.description,
      estimatedBudget: validatedData.estimatedBudget,
      plantLocation: validatedData.plantLocation,
      submissionMethod,
      status: "PENDING",
    });

    await AuditLog.create({
      action: "APPLICATION_SUBMITTED",
      performedBy: userPayload.userId,
      userEmail: userPayload.email,
      role: userPayload.role,
      sector: validatedData.sector,
      targetId: newApplication._id.toString(),
      details: {
        applicationNumber,
        title: newApplication.title,
        submissionMethod,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      {
        success: true,
        data: { application: newApplication },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
