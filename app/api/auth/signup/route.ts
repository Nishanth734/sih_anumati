import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { SignupSchema } from "@/lib/validators";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(`signup:${ip}`, 10, 60 * 1000);
    if (!limiter.success) {
      throw new ApiError(
        "Too many signup attempts. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await req.json();
    const validatedData = SignupSchema.parse(body);

    await connectToDatabase();

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw new ApiError(
        "A user with this email address already exists",
        409,
        "CONFLICT",
        { email: "Email already registered" }
      );
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const userData: any = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      sector: validatedData.sector,
    };

    if (validatedData.role === "entrepreneur") {
      userData.pan = validatedData.pan;
      userData.companyName = validatedData.companyName;
      userData.businessAddress = validatedData.businessAddress;
    } else if (validatedData.role === "officer") {
      userData.employeeId = validatedData.employeeId;
    }

    const newUser = await User.create(userData);

    // Create Audit Log entry
    await AuditLog.create({
      action: "USER_SIGNUP",
      performedBy: newUser._id,
      userEmail: newUser.email,
      role: newUser.role,
      sector: newUser.sector,
      ipAddress: ip,
      details: { role: newUser.role, sector: newUser.sector },
    });

    const sessionPayload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      sector: newUser.sector,
      ...(newUser.pan ? { pan: newUser.pan } : {}),
      ...(newUser.companyName ? { companyName: newUser.companyName } : {}),
      ...(newUser.employeeId ? { employeeId: newUser.employeeId } : {}),
    };

    const token = await createSessionToken(sessionPayload);

    const response = jsonSuccess(
      {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          sector: newUser.sector,
        },
      },
      201
    );

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
