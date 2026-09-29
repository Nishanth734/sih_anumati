import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { comparePassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(`login:${ip}`, 10, 60 * 1000);
    if (!limiter.success) {
      throw new ApiError(
        "Too many login attempts. Please wait a minute before trying again.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    const body = await req.json();
    const validatedData = LoginSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      throw new ApiError(
        "Invalid email address or password.",
        401,
        "UNAUTHORIZED"
      );
    }

    const isMatch = await comparePassword(validatedData.password, user.password);
    if (!isMatch) {
      throw new ApiError(
        "Invalid email address or password.",
        401,
        "UNAUTHORIZED"
      );
    }

    await AuditLog.create({
      action: "USER_LOGIN",
      performedBy: user._id,
      userEmail: user.email,
      role: user.role,
      sector: user.sector,
      ipAddress: ip,
    });

    const sessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      sector: user.sector,
      ...(user.pan ? { pan: user.pan } : {}),
      ...(user.companyName ? { companyName: user.companyName } : {}),
      ...(user.employeeId ? { employeeId: user.employeeId } : {}),
    };

    const token = await createSessionToken(sessionPayload);

    const response = jsonSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sector: user.sector,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
