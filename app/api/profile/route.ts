import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import EntrepreneurProfile from "@/models/EntrepreneurProfile";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/api-error";
import { EntrepreneurProfileSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      throw new ApiError("Authentication required", 401, "UNAUTHORIZED");
    }

    const session = await verifySessionToken(token);
    if (!session) {
      throw new ApiError("Session invalid or expired", 401, "UNAUTHORIZED");
    }

    await connectToDatabase();

    const profile = await EntrepreneurProfile.findOne({ userId: session.userId });

    if (!profile) {
      // Graceful fallback to user signup info if profile hasn't been explicitly created yet
      const user = await User.findById(session.userId);
      if (user && user.role === "entrepreneur") {
        return jsonSuccess({
          profile: {
            companyName: user.companyName || "",
            pan: user.pan || "",
            gstin: "", // Empty for new profile
            registeredAddress: user.businessAddress || "",
            sector: user.sector || "Boiler",
            phone: "",
            email: user.email || session.email,
            isInitialFallback: true,
          },
        });
      }
      return jsonSuccess({ profile: null });
    }

    return jsonSuccess({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      throw new ApiError("Authentication required", 401, "UNAUTHORIZED");
    }

    const session = await verifySessionToken(token);
    if (!session || session.role !== "entrepreneur") {
      throw new ApiError("Only entrepreneurs can maintain an industrial profile", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const validatedData = EntrepreneurProfileSchema.parse(body);

    await connectToDatabase();

    const updatedProfile = await EntrepreneurProfile.findOneAndUpdate(
      { userId: session.userId },
      {
        userId: session.userId,
        companyName: validatedData.companyName,
        pan: validatedData.pan.toUpperCase(),
        gstin: validatedData.gstin.toUpperCase(),
        registeredAddress: validatedData.registeredAddress,
        sector: validatedData.sector,
        phone: validatedData.phone,
        email: validatedData.email.toLowerCase(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Sync back to User collection
    await User.findByIdAndUpdate(session.userId, {
      companyName: validatedData.companyName,
      pan: validatedData.pan.toUpperCase(),
      businessAddress: validatedData.registeredAddress,
      sector: validatedData.sector,
    });

    await AuditLog.create({
      action: "PROFILE_UPDATED",
      performedBy: session.userId,
      userEmail: session.email,
      role: session.role,
      sector: validatedData.sector,
      details: {
        companyName: validatedData.companyName,
        pan: validatedData.pan,
        gstin: validatedData.gstin,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return jsonSuccess({ profile: updatedProfile });
  } catch (error) {
    return handleApiError(error);
  }
}
