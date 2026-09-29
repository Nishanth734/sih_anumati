"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Wind,
  Factory,
  RefreshCw,
} from "lucide-react";

export interface ISchemeItem {
  _id: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  schemeId: string;
  name: string;
  ministry: string;
  eligibilitySummary: string;
  benefits: string;
  benefitAmount: string;
  applicationDescription: string;
  officialLink: string;
}

interface RecommendedSchemesProps {
  userSector?: "Boiler" | "Pollution" | "FactoryLicense";
}

export default function RecommendedSchemes({ userSector = "Boiler" }: RecommendedSchemesProps) {
  const [activeSector, setActiveSector] = useState<"Boiler" | "Pollution" | "FactoryLicense">(userSector);
  const [schemes, setSchemes] = useState<ISchemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  useEffect(() => {
    if (userSector) {
      setActiveSector(userSector);
    }
  }, [userSector]);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/schemes?sector=${activeSector}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSchemes(data.data.schemes || []);
        } else {
          setError(data.error || "Failed to load government schemes.");
        }
      } catch (err) {
        setError("Network error loading statutory schemes.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [activeSector]);

  const toggleExpand = (schemeId: string) => {
    setExpandedSchemeId((prev) => (prev === schemeId ? null : schemeId));
  };

  const getSectorIcon = (sec: string) => {
    switch (sec) {
      case "Boiler":
        return <Flame className="w-4 h-4 text-amber-500" />;
      case "Pollution":
        return <Wind className="w-4 h-4 text-emerald-500" />;
      default:
        return <Factory className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Header Banner */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-gov-gold" />
            <h3 className="font-extrabold text-base text-slate-900">
              Recommended Government Incentives & Subsidies
            </h3>
            {userSector === activeSector && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Matched to Your Sector
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statutory financial grants, interest subventions, and safety capital subsidies for industrial units.
          </p>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
          {(["Boiler", "Pollution", "FactoryLicense"] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSector(sec)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                activeSector === sec
                  ? "bg-gov-navy text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {getSectorIcon(sec)}
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-gov-navy" />
            Fetching statutory schemes for {activeSector} sector...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : schemes.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-6 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">
              No Statutory Incentive Schemes Configured for {activeSector} Sector
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active government subsidy or grant schemes published for this sector. Please check back later or switch sector tabs to view available schemes.
            </p>
          </div>
        ) : (
          /* Schemes Cards List */
          <div className="grid grid-cols-1 gap-4">
            {schemes.map((scheme) => {
              const isExpanded = expandedSchemeId === scheme.schemeId;

              return (
                <div
                  key={scheme._id}
                  className={`border rounded-xl transition duration-200 overflow-hidden ${
                    isExpanded ? "border-gov-navy shadow-md bg-white" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {/* Scheme Card Header */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gov-blue" /> {scheme.ministry}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded border border-emerald-200">
                          💰 {scheme.benefitAmount}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-slate-900">{scheme.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{scheme.eligibilitySummary}</p>
                    </div>

                    {/* Learn More Toggle Button */}
                    <button
                      onClick={() => toggleExpand(scheme.schemeId)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition shrink-0 flex items-center gap-1.5 ${
                        isExpanded
                          ? "bg-gov-navy text-white border-gov-navy"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Learn More & Apply <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expandable Accordion Body */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-200 p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Eligibility & Benefits */}
                        <div className="space-y-3">
                          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full Eligibility Criteria
                            </span>
                            <p className="text-slate-800 leading-relaxed font-medium mt-1">
                              {scheme.eligibilitySummary}
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-600" /> Financial Benefits & Subsidy Details
                            </span>
                            <p className="text-slate-800 leading-relaxed font-medium mt-1">
                              {scheme.benefits}
                            </p>
                          </div>
                        </div>

                        {/* Application Procedure & Official Link */}
                        <div className="space-y-3 flex flex-col justify-between">
                          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-gov-blue" /> Application Instructions
                            </span>
                            <p className="text-slate-800 leading-relaxed font-medium mt-1">
                              {scheme.applicationDescription}
                            </p>
                          </div>

                          {/* Official Portal Link Button */}
                          <div className="pt-2 flex justify-end">
                            <a
                              href={scheme.officialLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow text-xs flex items-center gap-2 transition"
                            >
                              Apply on Official Government Portal <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
