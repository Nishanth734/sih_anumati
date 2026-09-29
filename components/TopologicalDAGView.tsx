"use client";

import React, { useState, useMemo } from "react";
import {
  computeTopologicalTiers,
  ComputedTierNode,
  DAGNode,
  STATUTORY_CLEARANCE_NODES,
} from "@/lib/topologicalService";
import {
  Network,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  Zap,
} from "lucide-react";

interface Props {
  userSector?: string;
}

export default function TopologicalDAGView({ userSector = "Boiler" }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<"Green" | "Orange" | "Red">("Orange");
  const [approvedNodes, setApprovedNodes] = useState<string[]>(["LAND_ALLOTMENT"]);
  const [selectedNode, setSelectedNode] = useState<ComputedTierNode | null>(null);

  const tiers = useMemo(() => {
    return computeTopologicalTiers(selectedCategory, approvedNodes);
  }, [selectedCategory, approvedNodes]);

  const toggleApproveNode = (nodeId: string) => {
    setApprovedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header and Category Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-lg text-gov-navy">
            <Network className="w-5 h-5 text-amber-500" />
            Topological Approval Dependency Graph (DAG)
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic prerequisite clearance sequencing computed via Kahn&apos;s algorithm.
          </p>
        </div>

        {/* Environmental Category Filter */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          {(["Green", "Orange", "Red"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? cat === "Green"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : cat === "Red"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat === "Green" && <Zap className="w-3.5 h-3.5" />}
              {cat} Category
            </button>
          ))}
        </div>
      </div>

      {/* Category Advisory Notice */}
      <div
        className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
          selectedCategory === "Green"
            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
            : selectedCategory === "Red"
            ? "bg-red-50 text-red-900 border-red-200"
            : "bg-amber-50 text-amber-900 border-amber-200"
        }`}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            {selectedCategory === "Green"
              ? "Green Category (Pollution Index < 20):"
              : selectedCategory === "Red"
              ? "Red Category (Pollution Index > 60):"
              : "Orange Category (Pollution Index 21 - 59):"}
          </span>{" "}
          {selectedCategory === "Green"
            ? "Fast-track 48-hour statutory clearance. Exempt from extensive Environmental Impact Assessment (EIA) and heavy effluent CTE approvals."
            : selectedCategory === "Red"
            ? "Strict sequential enforcement. Mandatory Consent to Establish (CTE) & Environmental Public Hearing before Factory Construction plans can be processed."
            : "Standard 30-day statutory SLA under MRTPS Act 2015. Requires sequential Fire NOC and Consent to Establish before factory erection."}
        </div>
      </div>

      {/* Interactive Simulation Helper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600">
        <span className="font-medium">
          💡 Click on any card to inspect statutory prerequisites or click &quot;Simulate Clearance&quot; to test DAG progression.
        </span>
        <span className="font-mono text-[11px] text-gov-navy font-bold shrink-0">
          {approvedNodes.length} of {STATUTORY_CLEARANCE_NODES.length} Clearances Active
        </span>
      </div>

      {/* Visual Tiers DAG Layout */}
      <div className="space-y-6 overflow-x-auto py-2">
        {tiers.map((tierNodes, tierIdx) => (
          <div key={tierIdx} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Tier {tierIdx} &bull; {tierIdx === 0 ? "Foundational Clearance" : `Prerequisite Level ${tierIdx}`}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isApproved = node.status === "APPROVED";
                const isReady = node.status === "READY";

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-xl border transition cursor-pointer relative ${
                      isApproved
                        ? "bg-emerald-50/50 border-emerald-300 hover:border-emerald-400 shadow-sm"
                        : isReady
                        ? "bg-white border-amber-300 hover:border-amber-400 shadow-md ring-1 ring-amber-200"
                        : "bg-slate-50/80 border-slate-200 hover:border-slate-300 opacity-75"
                    } ${isSelected ? "ring-2 ring-gov-navy" : ""}`}
                  >
                    {/* Top Row: Code & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {node.code}
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3 text-amber-600" /> Ready to File
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                      {node.title}
                    </h4>

                    {/* Department */}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{node.department}</span>
                    </p>

                    {/* SLA & Prerequisites count */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {node.estimatedDays} Days SLA
                      </span>
                      {node.prerequisites.length > 0 && (
                        <span className="font-mono text-[9px] text-slate-400">
                          {node.prerequisites.length} Prereq(s)
                        </span>
                      )}
                    </div>

                    {/* Quick Simulation Button */}
                    <div className="mt-3 pt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleApproveNode(node.id);
                        }}
                        className={`text-[10px] font-semibold px-2 py-1 rounded transition ${
                          isApproved
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-gov-navy hover:bg-slate-800 text-white"
                        }`}
                      >
                        {isApproved ? "Reset Clearance" : "Simulate Clearance"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Node Detail Modal / Panel */}
      {selectedNode && (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-block font-mono text-[10px] font-bold text-gov-navy bg-white px-2 py-0.5 rounded border border-slate-200 mb-1">
                {selectedNode.code} &bull; Tier {selectedNode.tier}
              </div>
              <h3 className="font-bold text-sm text-slate-900">{selectedNode.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedNode.department}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold">Statutory Legal Act:</span>
              <span className="font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 block">
                {selectedNode.statutoryAct}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold">Processing Timeline:</span>
              <span className="font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 block">
                {selectedNode.estimatedDays} Working Days (Mandated under MRTPS Act)
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 block text-[11px] font-semibold">Regulatory Description:</span>
            <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
              {selectedNode.description}
            </p>
          </div>

          {selectedNode.prerequisites.length > 0 && (
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 block text-[11px] font-semibold">
                Mandatory Prerequisite Approvals ({selectedNode.prerequisites.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedNode.prerequisites.map((prereqId) => {
                  const prereqNode = STATUTORY_CLEARANCE_NODES.find((n) => n.id === prereqId);
                  const isDone = approvedNodes.includes(prereqId);
                  return (
                    <span
                      key={prereqId}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                        isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-red-500" />
                      )}
                      {prereqNode?.title || prereqId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
