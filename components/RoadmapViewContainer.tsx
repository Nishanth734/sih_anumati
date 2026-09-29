"use client";

import React, { useState } from "react";
import RoadmapStepper from "@/components/RoadmapStepper";
import TopologicalDAGView from "@/components/TopologicalDAGView";
import { ListOrdered, Network } from "lucide-react";

interface Props {
  initialSector?: "Boiler" | "Pollution" | "FactoryLicense";
  userPrimarySector?: "Boiler" | "Pollution" | "FactoryLicense";
}

export default function RoadmapViewContainer({
  initialSector = "Boiler",
  userPrimarySector,
}: Props) {
  const [activeTab, setActiveTab] = useState<"stepper" | "dag">("dag");

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("dag")}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
            activeTab === "dag"
              ? "bg-gov-navy text-white"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          <Network className="w-4 h-4 text-gov-gold" />
          Interactive Topological DAG (Kahn&apos;s Algorithm)
        </button>

        <button
          onClick={() => setActiveTab("stepper")}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
            activeTab === "stepper"
              ? "bg-gov-navy text-white"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          <ListOrdered className="w-4 h-4 text-gov-gold" />
          Linear Sector Checklist
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "dag" ? (
        <TopologicalDAGView userSector={userPrimarySector || initialSector} />
      ) : (
        <RoadmapStepper
          initialSector={initialSector}
          userPrimarySector={userPrimarySector}
        />
      )}
    </div>
  );
}
