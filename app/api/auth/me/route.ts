import { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      throw new ApiError("Not authenticated", 401, "UNAUTHORIZED");
    }

    const session = await verifySessionToken(token);
    if (!session) {
      throw new ApiError("Session expired or invalid", 401, "UNAUTHORIZED");
    }

    return jsonSuccess({ user: session });
  } catch (error) {
    return handleApiError(error);
  }
}
