"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { evaluateCadSetback, CadScrutinyReport, Point2D } from "@/lib/cadScrutinyService";
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Building2,
  Flame,
  FileCheck,
  HelpCircle,
  Sliders,
  Scale,
} from "lucide-react";

const DEFAULT_PLOT: Point2D[] = [
  { x: 0, y: 0 },
  { x: 80, y: 0 },
  { x: 80, y: 60 },
  { x: 0, y: 60 },
];

export default function PreScrutinyPage() {
  // Equipment coordinates in meters
  const [posX, setPosX] = useState(25);
  const [posY, setPosY] = useState(12); // Default to a 12m violation
  const [unitType, setUnitType] = useState<"BOILER" | "CHEMICAL_STORAGE" | "TRANSFORMER">("BOILER");
  const [report, setReport] = useState<CadScrutinyReport | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute evaluation whenever position or unit changes
  useEffect(() => {
    try {
      const result = evaluateCadSetback({
        plotBoundary: DEFAULT_PLOT,
        equipmentLocation: { x: posX, y: posY },
        equipmentName: `${unitType} Unit #1`,
        unitWidth: 4,
        unitHeight: 4,
        unitType,
      });
      setReport(result);
    } catch (err) {
      console.error(err);
    }
  }, [posX, posY, unitType]);

  // Render 2D Canvas Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate mapping: Plot is 80m x 60m. Scale to fit canvas with padding.
    const padding = 50;
    const scaleX = (width - padding * 2) / 80;
    const scaleY = (height - padding * 2) / 60;
    const scale = Math.min(scaleX, scaleY);

    const toCanvasX = (mX: number) => padding + mX * scale;
    const toCanvasY = (mY: number) => height - padding - mY * scale; // Invert Y for Cartesian

    // 1. Draw Background Grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 80; x += 10) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), toCanvasY(0));
      ctx.lineTo(toCanvasX(x), toCanvasY(60));
      ctx.stroke();
    }
    for (let y = 0; y <= 60; y += 10) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), toCanvasY(y));
      ctx.lineTo(toCanvasX(80), toCanvasY(y));
      ctx.stroke();
    }

    // 2. Draw 15m Statutory Buffer Zone (Shaded Exclusion Area)
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;

    // Buffer rectangle: (15, 15) to (65, 45)
    ctx.strokeRect(
      toCanvasX(15),
      toCanvasY(45),
      (80 - 30) * scale,
      (60 - 30) * scale
    );

    // 3. Draw Plot Boundary (Outer Polygon)
    ctx.setLineDash([]);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(toCanvasX(0), toCanvasY(60), 80 * scale, 60 * scale);

    // 4. Draw Boundary Labels
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 10px monospace";
    ctx.fillText("North Boundary (80m)", toCanvasX(30), toCanvasY(61) - 8);
    ctx.fillText("South Boundary (80m)", toCanvasX(30), toCanvasY(0) + 16);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("West (60m)", -toCanvasY(25), toCanvasX(0) - 10);
    ctx.fillText("East (60m)", -toCanvasY(25), toCanvasX(80) + 20);
    ctx.restore();

    // 5. Draw Setback Dimension Line to Critical Edge
    if (report) {
      const eqX = toCanvasX(posX);
      const eqY = toCanvasY(posY);

      // Line to nearest boundary (South if Y <= 15, West if X <= 15, etc.)
      ctx.strokeStyle = report.isCompliant ? "#10b981" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(eqX, eqY);
      // Project to nearest edge for visual clarity
      let projX = eqX;
      let projY = eqY;
      if (posY <= 15) projY = toCanvasY(0);
      else if (posY >= 45) projY = toCanvasY(60);
      else if (posX <= 15) projX = toCanvasX(0);
      else if (posX >= 65) projX = toCanvasX(80);
      else projY = toCanvasY(0);

      ctx.lineTo(projX, projY);
      ctx.stroke();

      // Measurement tag
      ctx.setLineDash([]);
      ctx.fillStyle = report.isCompliant ? "#065f46" : "#991b1b";
      ctx.font = "bold 11px sans-serif";
      const midX = (eqX + projX) / 2 + 6;
      const midY = (eqY + projY) / 2;
      ctx.fillText(`${report.actualMinSetbackMeters}m setback`, midX, midY);
    }

    // 6. Draw Equipment Unit
    const eqX = toCanvasX(posX);
    const eqY = toCanvasY(posY);
    const unitSize = 4 * scale;

    ctx.fillStyle = report?.isCompliant ? "#10b981" : "#ef4444";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eqX, eqY, unitSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Equipment label
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(`${unitType}`, eqX - 18, eqY - 14);
  }, [posX, posY, unitType, report]);

  const loadPreset = (preset: "VIOLATION" | "COMPLIANT") => {
    if (preset === "VIOLATION") {
      setPosX(25);
      setPosY(10.5); // 10.5m setback (Violates 15m rule)
    } else {
      setPosX(35);
      setPosY(24.5); // 24.5m setback (Compliant)
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gov-navy tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-gov-gold" />
            CAD &amp; Spatial Setback Pre-Scrutiny Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify compliance with MIDC DCR Section 14.2 &amp; NBC 2016 (15-Meter Hazardous Perimeter Buffer) before filing.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPreset("VIOLATION")}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold rounded-lg border border-red-300 transition shadow-sm"
          >
            Sample: Buffer Violation (10.5m)
          </button>
          <button
            onClick={() => loadPreset("COMPLIANT")}
            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-300 transition shadow-sm"
          >
            Sample: Compliant Buffer (24.5m)
          </button>
        </div>
      </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas Visualizer */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <Maximize2 className="w-4 h-4 text-gov-navy" />
                Plot Boundary Blueprint (80m &times; 60m Site Layout)
              </div>
              <span className="text-[11px] font-mono text-slate-400">1 unit = 1 meter</span>
            </div>

            <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                width={560}
                height={400}
                className="w-full max-w-[560px] h-auto rounded bg-white shadow-inner"
              />
            </div>

            {/* Slider Controls for Real-Time Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>X Position (Horizontal):</span>
                  <span className="font-mono text-gov-navy font-bold">{posX} meters</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="75"
                  step="0.5"
                  value={posX}
                  onChange={(e) => setPosX(parseFloat(e.target.value))}
                  className="w-full accent-gov-navy"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Y Position (Vertical):</span>
                  <span className="font-mono text-gov-navy font-bold">{posY} meters</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="0.5"
                  value={posY}
                  onChange={(e) => setPosY(parseFloat(e.target.value))}
                  className="w-full accent-gov-navy"
                />
              </div>
            </div>

            {/* Equipment Selector */}
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className="font-bold text-slate-700">Equipment Type:</span>
              {(["BOILER", "CHEMICAL_STORAGE", "TRANSFORMER"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setUnitType(type)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    unitType === type
                      ? "bg-gov-navy text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Right Scrutiny Report Proof Sheet */}
          <div className="lg:col-span-5 space-y-4">
            {report && (
              <div
                className={`rounded-2xl border-2 p-6 shadow-sm space-y-5 transition ${
                  report.isCompliant
                    ? "bg-emerald-50/40 border-emerald-500/40"
                    : "bg-red-50/40 border-red-500/40"
                }`}
              >
                {/* Status Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      Automated Pre-Scrutiny Result
                    </span>
                    <h3 className="text-xl font-extrabold flex items-center gap-2">
                      {report.isCompliant ? (
                        <span className="text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          COMPLIANT SETBACK
                        </span>
                      ) : (
                        <span className="text-red-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                          SETBACK VIOLATION
                        </span>
                      )}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      report.isCompliant
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-red-200 text-red-900"
                    }`}
                  >
                    {report.actualMinSetbackMeters}m / 15.0m
                  </span>
                </div>

                {/* Statutory Comparison Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Statutory Minimum:</span>
                    <span className="font-bold text-slate-800 text-sm">15.00 Meters</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Measured Buffer:</span>
                    <span
                      className={`font-bold text-sm ${
                        report.isCompliant ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {report.actualMinSetbackMeters} Meters
                    </span>
                  </div>
                </div>

                {/* Boundary Edges Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Perimeter Distance Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {report.edgeAnalysis.map((edge) => (
                      <div
                        key={edge.edgeIndex}
                        className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                          edge.isCompliant
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-red-50 border-red-200 text-red-900 font-bold"
                        }`}
                      >
                        <span>{edge.edgeLabel}:</span>
                        <span className="font-mono">{edge.distanceToEdge}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Engineering Advice */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-800">Actionable Remediation Guidance:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed text-[11px]">
                    {report.remediationAdvice}
                  </p>
                </div>

                {/* Statutory Gazette Citation */}
                <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-3 space-y-1">
                  <div className="font-bold uppercase text-slate-600">Governing Statutory Authority</div>
                  <div>{report.legalCitation}</div>
                </div>

                {/* Cryptographic SHA-256 Audit Seal */}
                <div className="pt-2">
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    SHA-256: {report.complianceProofHash}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
