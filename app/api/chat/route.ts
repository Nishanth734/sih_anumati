import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getCurrentUserSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { handleApiError, ApiError } from "@/lib/api-error";
import { retrieveRelevantChunks } from "@/lib/rag/retrievalEngine";
import { generateRagAnswer } from "@/lib/rag/groqRagService";
import ChatHistory from "@/models/ChatHistory";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat - RAG Chat completion with statutory citation retrieval & rate limiting
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new ApiError("Authentication required to access statutory compliance chat.", 401, "UNAUTHORIZED");
    }

    // Rate Limiting: 10 queries per minute per user
    const rateLimitKey = `chat_${session.userId}`;
    const limit = rateLimit(rateLimitKey, 10, 60 * 1000);

    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Maximum 10 chat queries per minute permitted.",
          code: "RATE_LIMIT_EXCEEDED",
          resetSeconds: limit.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.reset),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const userQuery = body.message?.trim();

    if (!userQuery) {
      throw new ApiError("Query message is required.", 400, "VALIDATION_ERROR");
    }

    const targetSector = (body.sector || session.sector || "Boiler") as "Boiler" | "Pollution" | "FactoryLicense";

    await connectToDatabase();

    // 1. Simple Retrieval: Sector-scoped keyword ranking
    const chunks = await retrieveRelevantChunks(targetSector, userQuery, 3);

    // 2. RAG Execution via Groq API (llama-3.3-70b-versatile) / Internal Statutory Engine
    const ragResult = await generateRagAnswer(userQuery, targetSector, chunks);

    const userMsgId = randomUUID();
    const assistantMsgId = randomUUID();
    const now = new Date();

    const userMessage = {
      id: userMsgId,
      role: "user" as const,
      content: userQuery,
      createdAt: now,
    };

    const assistantMessage = {
      id: assistantMsgId,
      role: "assistant" as const,
      content: ragResult.answer,
      citations: ragResult.citations,
      createdAt: new Date(now.getTime() + 10),
    };

    // 3. Persist Chat History per User in MongoDB
    await ChatHistory.findOneAndUpdate(
      { userId: session.userId },
      {
        sector: targetSector,
        $push: { messages: { $each: [userMessage, assistantMessage] } },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          message: assistantMessage,
          citations: ragResult.citations,
          usedFallback: ragResult.usedFallback,
          modelUsed: ragResult.modelUsed,
          error: ragResult.error,
        },
        rateLimit: {
          remaining: limit.remaining,
          reset: limit.reset,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/chat - Fetch persisted chat history for logged-in user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new ApiError("Authentication required to access statutory chat history.", 401, "UNAUTHORIZED");
    }

    await connectToDatabase();

    const chatDoc = await ChatHistory.findOne({ userId: session.userId }).lean();

    return NextResponse.json({
      success: true,
      data: {
        sector: chatDoc?.sector || session.sector || "Boiler",
        messages: chatDoc?.messages || [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/chat - Clear persisted chat history for logged-in user
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new ApiError("Authentication required.", 401, "UNAUTHORIZED");
    }

    await connectToDatabase();
    await ChatHistory.deleteOne({ userId: session.userId });

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
