"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  PieChart,
} from "lucide-react";

export interface RejectionReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface SectorAnalyticsData {
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  totalSectorRejections: number;
  breakdown: RejectionReasonBreakdown[];
}

export default function RejectionAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<SectorAnalyticsData[]>([]);
  const [selectedSector, setSelectedSector] = useState<"Boiler" | "Pollution" | "FactoryLicense" | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [cacheTtl, setCacheTtl] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/analytics/rejections${refresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      const resData = await res.json();

      if (resData.success) {
        setAnalytics(Array.isArray(resData.data) ? resData.data : []);
        setIsCached(resData.cached || false);
        setCacheTtl(resData.cacheExpiresInSeconds || null);
      } else {
        setAnalytics([]);
        setError(resData.error || "Failed to load rejection analytics");
      }
    } catch (err) {
      setAnalytics([]);
      setError("Network error loading analytics dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const analyticsList = Array.isArray(analytics) ? analytics : [];

  // Filter analytics data based on selected sector
  const activeSectors =
    selectedSector === "ALL"
      ? analyticsList
      : analyticsList.filter((a) => a.sector === selectedSector);

  const totalAggregatedRejections = analyticsList.reduce(
    (acc, curr) => acc + (curr.totalSectorRejections || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-base text-gov-navy">
            <BarChart3 className="w-5 h-5 text-gov-gold" />
            Statutory Rejection Reason Analytics
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-side MongoDB aggregation of rejection categories and statutory compliance failures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cache Status Badge */}
          {isCached && cacheTtl !== null && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-mono font-semibold rounded-md flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" /> Cached ({cacheTtl}s TTL)
            </span>
          )}

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-gov-navy hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="Force Cache Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sector Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 font-semibold mr-1">Sector Filter:</span>
        {(["ALL", "Boiler", "Pollution", "FactoryLicense"] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedSector === sec
                ? "bg-gov-navy text-white shadow"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            {sec === "ALL" ? "All Sectors" : sec}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 py-6">
          <div className="h-4 bg-slate-200 rounded-full w-1/3 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-1.5">
                <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                <div className="h-6 bg-slate-100 rounded-lg w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (totalAggregatedRejections === 0 || activeSectors.every((s) => s.totalSectorRejections === 0)) && (
        <div className="p-8 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-12 h-12 mx-auto bg-slate-200 text-slate-400 rounded-full flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Rejection Data Recorded</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              No statutory application rejections or document verification failures found for the selected sector scope.
            </p>
          </div>
        </div>
      )}

      {/* Aggregated Analytics Bar Charts */}
      {!loading && !error && activeSectors.length > 0 && (
        <div className="space-y-6">
          {activeSectors.map((secData) => {
            if (secData.totalSectorRejections === 0 && selectedSector === "ALL") {
              return null; // Skip empty sectors in ALL view if preferred
            }

            return (
              <div key={secData.sector} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-gov-navy text-gov-gold text-[10px] font-bold rounded font-mono uppercase">
                      {secData.sector} SECTOR
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Total Rejections: {secData.totalSectorRejections}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    AuditLog Aggregation
                  </span>
                </div>

                {secData.breakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No category breakdowns recorded yet.</p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {secData.breakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 line-clamp-1 max-w-lg">
                            {item.reason}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="text-slate-600 text-[11px]">{item.count} cases</span>
                            <span className="font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded text-[11px]">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Bar Chart Graphic */}
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
