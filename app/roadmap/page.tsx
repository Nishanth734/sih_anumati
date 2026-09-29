import { getCurrentUserSession } from "@/lib/auth";
import RoadmapViewContainer from "@/components/RoadmapViewContainer";
import { Compass, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Industrial Clearance Roadmap | ANUMATI Platform",
  description: "Step-by-step statutory approval checklist and document requirements by industry sector.",
};

export default async function RoadmapPage() {
  const user = await getCurrentUserSession();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gov-navy tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-gov-gold" />
            Industrial Clearance &amp; Licensing Roadmap
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official Single-Window statutory workflow guide for enterprise setup and environmental clearances in India.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>State Regulatory Gazette 2026</span>
        </div>
      </div>

      {/* Stepper & DAG View Component */}
      <RoadmapViewContainer
        initialSector={user?.sector || "Boiler"}
        userPrimarySector={user?.sector}
      />
    </div>
  );
}
