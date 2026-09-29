import { getCurrentUserSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import RoadmapStepper from "@/components/RoadmapStepper";
import { Compass, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Industrial Clearance Roadmap | ANUMATI Platform",
  description: "Step-by-step statutory approval checklist and document requirements by industry sector.",
};

export default async function RoadmapPage() {
  const user = await getCurrentUserSession();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gov-navy tracking-tight flex items-center gap-2">
              <Compass className="w-7 h-7 text-gov-gold" />
              Industrial Clearance & Licensing Roadmap
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Single-Window statutory workflow guide for enterprise setup and environmental clearances in India.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>State Regulatory Gazette 2026</span>
          </div>
        </div>

        {/* Stepper Component */}
        <RoadmapStepper
          initialSector={user?.sector || "Boiler"}
          userPrimarySector={user?.sector}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} ANUMATI Industrial Clearance Portal. Government of India.</p>
          <p className="text-[11px] text-slate-500">
            Powered by Single-Window National Single Window System (NSWS) API Framework
          </p>
        </div>
      </footer>
    </div>
  );
}
