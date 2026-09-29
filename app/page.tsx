import Link from "next/link";
import {
  ShieldCheck,
  Flame,
  Factory,
  Wind,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
  Zap,
  Compass,
  Layers,
  Bot,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-2">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-gov-navy via-slate-900 to-gov-blue text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            National Single-Window Industrial Gateway 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Single-Window Industrial Clearance &amp; Licensing Portal
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Accelerate industrial approvals, boiler safety licensing, and environmental NOC compliance with ANUMATI — India&apos;s unified digital clearance engine powered by automated CAD scrutiny, Kahn&apos;s DAG scheduling, and statutory RAG verification.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              Register Industrial Unit <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/roadmap"
              className="px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-gov-gold" />
              Explore Statutory Roadmap
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 text-slate-300 hover:text-white font-medium text-sm transition"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Core Interactive Modules */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">Digital Clearance Modules</h2>
          <p className="text-xs text-slate-600">
            Automated statutory intelligence tools designed to eliminate regulatory delays and bureaucratic bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Roadmap */}
          <Link
            href="/roadmap"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-amber-50 text-amber-700 w-fit rounded-xl mb-4 group-hover:scale-105 transition">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-gov-navy transition flex items-center justify-between">
                Topological DAG Roadmap
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Deterministic prerequisite scheduling via Kahn&apos;s algorithm. Computes parallel clearance tiers and 48-hour fast-track eligibility.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Tiered Parallel Approvals
              </span>
              <span className="text-slate-400 group-hover:text-amber-700 font-medium transition">
                Open Roadmap &rarr;
              </span>
            </div>
          </Link>

          {/* Module 2: CAD Setback Pre-Scrutiny */}
          <Link
            href="/pre-scrutiny"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-emerald-50 text-emerald-700 w-fit rounded-xl mb-4 group-hover:scale-105 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-gov-navy transition flex items-center justify-between">
                CAD Setback Pre-Scrutiny
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Interactive spatial verification engine. Tests plant boundaries and equipment placement against NBC 2016 and MIDC 15m hazardous buffers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Instant Spatial Validation
              </span>
              <span className="text-slate-400 group-hover:text-emerald-700 font-medium transition">
                Launch CAD Tool &rarr;
              </span>
            </div>
          </Link>

          {/* Module 3: Statutory AI */}
          <Link
            href="/chat"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-400/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-sky-50 text-sky-700 w-fit rounded-xl mb-4 group-hover:scale-105 transition">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-gov-navy transition flex items-center justify-between">
                Statutory AI Assistant
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                RAG-powered regulatory advisor. Ask questions about boiler rules, effluent discharge limits, or worker welfare regulations with legal citations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                Statutory Citations
              </span>
              <span className="text-slate-400 group-hover:text-sky-700 font-medium transition">
                Ask AI &rarr;
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Regulated Industry Sectors Covered */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">Supported Regulatory Sectors</h2>
          <p className="text-xs text-slate-600">
            Standardized clearance roadmaps mapped directly to statutory government acts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Boiler Sector */}
          <Link
            href="/roadmap"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition"
          >
            <div className="p-3 bg-amber-100 text-amber-700 w-fit rounded-lg mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-amber-700 transition">
              Boiler Inspection &amp; Safety
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Clearance for high-pressure industrial boilers, manufacturing inspection certificates, and hydrostatic testing under Indian Boilers Act 1923.
            </p>
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded w-fit">
              Sector: Boiler
            </div>
          </Link>

          {/* Pollution Sector */}
          <Link
            href="/roadmap"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="p-3 bg-emerald-100 text-emerald-700 w-fit rounded-lg mb-4">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition">
              Pollution Control Board NOC
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Consent to Establish (CTE) &amp; Consent to Operate (CTO) environmental clearances across air, water, and hazardous waste categories.
            </p>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded w-fit">
              Sector: Pollution
            </div>
          </Link>

          {/* Factory Sector */}
          <Link
            href="/roadmap"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition"
          >
            <div className="p-3 bg-blue-100 text-blue-700 w-fit rounded-lg mb-4">
              <Factory className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition">
              Factory License &amp; Safety
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Building plan approval, machinery electrical safety verification, and worker welfare compliance under Factories Act 1948.
            </p>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded w-fit">
              Sector: FactoryLicense
            </div>
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="p-2.5 bg-white w-fit mx-auto rounded-xl shadow-sm text-gov-navy">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Fast-Track SLA Engine</h4>
            <p className="text-xs text-slate-600">Strict statutory timelines with automated deemed approval countdowns.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-white w-fit mx-auto rounded-xl shadow-sm text-gov-navy">
              <Lock className="w-5 h-5 text-sky-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Role-Based Security</h4>
            <p className="text-xs text-slate-600">Strict separation between Entrepreneur and Departmental Officer portals.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-white w-fit mx-auto rounded-xl shadow-sm text-gov-navy">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Dual-Layer Verification</h4>
            <p className="text-xs text-slate-600">OCR regex parsing combined with vector RAG statutory clause scrutiny.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-white w-fit mx-auto rounded-xl shadow-sm text-gov-navy">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Cryptographic Audit Trail</h4>
            <p className="text-xs text-slate-600">Immutable SHA-256 digital seals on every approved certificate.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
