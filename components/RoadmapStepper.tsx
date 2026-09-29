"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  Building,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
  Sparkles,
  MapPinOff,
} from "lucide-react";

export interface IRoadmapStep {
  stepNumber: number;
  stepCode: string;
  title: string;
  description: string;
  department: string;
  requiredDocuments: string[];
  estimatedProcessingTime: string;
}

export interface IRoadmapData {
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  title: string;
  description: string;
  orderedSteps: IRoadmapStep[];
  userProgress?: {
    completedStepNumbers: number[];
    currentStepNumber: number;
    totalSteps: number;
    applicationsCount: number;
    activeApplicationStatus: string | null;
  };
}

interface Props {
  initialSector?: "Boiler" | "Pollution" | "FactoryLicense";
  userPrimarySector?: "Boiler" | "Pollution" | "FactoryLicense";
}

export default function RoadmapStepper({ initialSector = "Boiler", userPrimarySector }: Props) {
  const [activeSector, setActiveSector] = useState<"Boiler" | "Pollution" | "FactoryLicense">(
    userPrimarySector || initialSector
  );
  const [roadmap, setRoadmap] = useState<IRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`/api/roadmap?sector=${activeSector}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((resData) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        if (resData.success) {
          setRoadmap(resData.data || null);
          if (resData.data?.userProgress?.currentStepNumber) {
            setExpandedStep(resData.data.userProgress.currentStepNumber);
          } else if (resData.data?.orderedSteps?.length > 0) {
            setExpandedStep(1);
          }
        } else {
          setError(resData.error || "Failed to load sector roadmap");
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        if (err.name === "AbortError") {
          setError("Roadmap loading request timed out");
        } else {
          setError("Network error while loading roadmap");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [activeSector]);

  const toggleExpand = (stepNum: number) => {
    setExpandedStep((prev) => (prev === stepNum ? null : stepNum));
  };

  const completedSteps = roadmap?.userProgress?.completedStepNumbers || [];
  const currentStepNum = roadmap?.userProgress?.currentStepNumber || 1;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gov-navy text-white rounded-xl shadow-lg p-6 border border-slate-700 overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-gov-gold">
              <Compass className="w-6 h-6" />
              Statutory Industrial Clearance Roadmap
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Sequential regulatory timeline detailing mandatory clearances, required statutory documentation, and estimated government processing SLAs.
            </p>
          </div>

          {userPrimarySector && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-mono self-start md:self-auto">
              <Sparkles className="w-3.5 h-3.5" />
              Registered Sector: <span className="font-bold uppercase">{userPrimarySector}</span>
            </div>
          )}
        </div>

        {/* Sector Selector Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="text-xs text-slate-300 font-semibold mr-2">Select Industry Sector:</span>
          {(["Boiler", "Pollution", "FactoryLicense"] as const).map((sec) => {
            const isSelected = activeSector === sec;
            const isUserSec = userPrimarySector === sec;
            return (
              <button
                key={sec}
                onClick={() => setActiveSector(sec)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                }`}
              >
                {sec === "Boiler" && "Boiler Operations"}
                {sec === "Pollution" && "Pollution Control NOC"}
                {sec === "FactoryLicense" && "Factory License & Safety"}
                {isUserSec && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-900/40 text-amber-200 rounded font-mono">
                    My Sector
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gov-navy border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading statutory clearance roadmap...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty / Unconfigured State */}
      {!loading && !error && (!roadmap || !roadmap.orderedSteps || roadmap.orderedSteps.length === 0) && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200">
            <MapPinOff className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Roadmap Not Configured Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Statutory clearance guidelines for the <span className="font-semibold">{activeSector}</span> sector are currently being updated by the state regulatory board.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveSector(userPrimarySector || "Boiler")}
              className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow transition inline-flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-gov-gold" />
              View Default Sector Roadmap
            </button>
          </div>
        </div>
      )}

      {/* Stepper Content */}
      {!loading && !error && roadmap && roadmap.orderedSteps && roadmap.orderedSteps.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Roadmap Description */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h2 className="text-lg font-bold text-gov-navy">{roadmap.title}</h2>
            <p className="text-xs text-slate-600 mt-1">{roadmap.description}</p>
          </div>

          {/* Stepper Steps List */}
          <div className="p-6">
            <ol role="list" aria-label="Industrial Clearance Roadmap Steps" className="relative space-y-8">
              {roadmap.orderedSteps.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.stepNumber);
                const isCurrent = currentStepNum === step.stepNumber && !isCompleted;
                const isUpcoming = step.stepNumber > currentStepNum && !isCompleted;
                const isExpanded = expandedStep === step.stepNumber;
                const isLast = idx === roadmap.orderedSteps.length - 1;

                return (
                  <li
                    key={step.stepNumber}
                    role="listitem"
                    aria-current={isCurrent ? "step" : undefined}
                    className="relative pl-10 sm:pl-12"
                  >
                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <span
                        className={`absolute left-4 sm:left-5 top-9 bottom-[-32px] w-0.5 -ml-px ${
                          isCompleted ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Circle Indicator */}
                    <div
                      className={`absolute left-0 top-0.5 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow ${
                        isCompleted
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                          : isCurrent
                          ? "bg-gov-navy text-gov-gold ring-4 ring-sky-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? originalStepBadge(step.stepNumber) : (
                        <span>{step.stepNumber}</span>
                      )}
                    </div>

                    {/* Step Card Container */}
                    <div
                      className={`border rounded-xl transition overflow-hidden ${
                        isCurrent
                          ? "border-gov-navy shadow-md bg-slate-900/5"
                          : isCompleted
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* Step Header */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(step.stepNumber)}
                        aria-expanded={isExpanded}
                        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-gov-navy rounded-xl"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Step Badge */}
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded font-mono uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Step Cleared
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded font-mono uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Active Step
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded font-mono uppercase flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Upcoming
                              </span>
                            )}

                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" /> {step.department}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900">{step.title}</h3>

                          <p className="text-xs text-slate-600 line-clamp-2">{step.description}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            <Clock className="w-3 h-3 text-gov-gold" /> {step.estimatedProcessingTime}
                          </span>
                          <div className="p-1 text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expandable Step Details */}
                      {isExpanded && (
                        <div className="px-4 pb-5 sm:px-5 sm:pb-5 border-t border-slate-200 pt-4 space-y-4 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-gov-navy" /> Mandatory Statutory Documents
                              </h4>
                              <ul className="space-y-1.5">
                                {step.requiredDocuments.map((doc, docIdx) => (
                                  <li key={docIdx} className="text-xs text-slate-600 flex items-start gap-2">
                                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">Department:</span>
                                <span className="font-mono text-slate-900">{step.department}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">Estimated SLA:</span>
                                <span className="font-mono text-emerald-700 font-bold">
                                  {step.estimatedProcessingTime}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">Stage Identifier:</span>
                                <span className="font-mono text-slate-500 text-[11px]">{step.stepCode}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 italic">
                              {isCompleted
                                ? "This clearance stage has been successfully approved."
                                : isCurrent
                                ? "Action Required: Submit application for this clearance stage."
                                : "Complete previous clearance stages to unlock."}
                            </span>

                            <Link
                              href="/dashboard/entrepreneur"
                              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow transition inline-flex items-center gap-1.5 ${
                                isCompleted
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                                  : isCurrent
                                  ? "bg-gov-navy hover:bg-slate-800 text-white"
                                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              <span>{isCompleted ? "View Clearance Record" : "File Application"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function originalStepBadge(stepNum: number) {
  return <span>{stepNum}</span>;
}
