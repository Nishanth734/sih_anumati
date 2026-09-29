import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { getCurrentUserSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

// In-Memory Cache Store (5-Minute TTL)
let cachedAnalyticsData: any = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Strict Server-Side Officer / Admin Access Control
    const userPayload = await getCurrentUserSession();
    if (!userPayload || userPayload.role !== "officer") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Access restricted to statutory government officers and administrators.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";
    const now = Date.now();

    // 2. Serve from 5-minute TTL Cache if valid and not force-refreshed
    if (!forceRefresh && cachedAnalyticsData && now < cacheExpiryTime) {
      return NextResponse.json(
        {
          success: true,
          data: cachedAnalyticsData,
          cached: true,
          cacheExpiresInSeconds: Math.round((cacheExpiryTime - now) / 1000),
        },
        {
          status: 200,
          headers: { "X-Cache": "HIT" },
        }
      );
    }

    // 3. Server-Side MongoDB Aggregation Pipeline
    const pipeline = [
      {
        $match: {
          $or: [
            { action: "APPLICATION_REJECTED" },
            { action: "DOCUMENT_VERIFIED", "details.verificationStatus": "FAILED" },
          ],
        },
      },
      {
        $project: {
          sector: { $ifNull: ["$sector", "Boiler"] },
          reasons: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$details.failures", null] },
                  { $gt: [{ $size: { $ifNull: ["$details.failures", []] } }, 0] },
                ],
              },
              then: "$details.failures",
              else: [
                {
                  $ifNull: [
                    "$details.reason",
                    { $ifNull: ["$details.remarks", "Unspecified Statutory Rejection"] },
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $unwind: "$reasons",
      },
      {
        $group: {
          _id: {
            sector: "$sector",
            reason: "$reasons",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.sector",
          totalSectorRejections: { $sum: "$count" },
          breakdown: {
            $push: {
              reason: "$_id.reason",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          sector: "$_id",
          totalSectorRejections: 1,
          breakdown: {
            $map: {
              input: "$breakdown",
              as: "item",
              in: {
                reason: "$$item.reason",
                count: "$$item.count",
                percentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$item.count", "$totalSectorRejections"] },
                        100,
                      ],
                    },
                    1,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $sort: { totalSectorRejections: -1 },
      },
    ];

    const aggregationResult = await AuditLog.aggregate(pipeline as any);

    // Default structure for sectors even if empty
    const allSectors = ["Boiler", "Pollution", "FactoryLicense"];
    const formattedData = allSectors.map((sec) => {
      const found = aggregationResult.find((item: any) => item.sector === sec);
      if (found) {
        // Sort breakdown reasons by count descending
        found.breakdown.sort((a: any, b: any) => b.count - a.count);
        return found;
      }
      return {
        sector: sec,
        totalSectorRejections: 0,
        breakdown: [],
      };
    });

    // 4. Update Server-Side Cache
    cachedAnalyticsData = formattedData;
    cacheExpiryTime = now + CACHE_TTL_MS;

    return NextResponse.json(
      {
        success: true,
        data: formattedData,
        cached: false,
        cacheExpiresInSeconds: Math.round(CACHE_TTL_MS / 1000),
      },
      {
        status: 200,
        headers: { "X-Cache": "MISS" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
