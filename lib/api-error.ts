import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR";

export class ApiError extends Error {
  public statusCode: number;
  public code: ApiErrorCode;
  public details?: any;

  constructor(message: string, statusCode = 500, code: ApiErrorCode = "INTERNAL_SERVER_ERROR", details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  console.error("[API Error Handler]:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const field = err.path.join(".");
      formattedErrors[field || "general"] = err.message;
    });

    return NextResponse.json(
      {
        success: false,
        error: "Validation failed. Please check the input fields.",
        code: "VALIDATION_ERROR",
        details: formattedErrors,
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}
