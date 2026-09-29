import Link from "next/link";
import { ShieldCheck, Flame, Factory, Wind, ArrowRight, CheckCircle2, Lock, FileText, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gov-navy via-slate-900 to-gov-blue text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> State Industrial Clearance Mandate 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Single-Window Industrial Clearance & License Portal
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Accelerate factory setup, boiler safety licensing, and environmental NOC compliance with ANUMATI — India&apos;s unified digital industrial approval platform.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/signup"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              Register Unit / Company <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl transition"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Industrial Sectors Covered */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Supported Industry Sectors</h2>
          <p className="text-xs text-slate-600">
            Streamlined approval workflows managed by designated sector departmental officers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Boiler Sector */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-3 bg-amber-100 text-amber-700 w-fit rounded-lg mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Boiler Inspection & Safety</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Clearance for high-pressure industrial boilers, manufacturing inspection certificates, and periodic safety audits.
            </p>
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded w-fit">
              Sector Code: Boiler
            </div>
          </div>

          {/* Pollution Sector */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-3 bg-emerald-100 text-emerald-700 w-fit rounded-lg mb-4">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pollution Control Board NOC</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Consent to Establish (CTE) & Consent to Operate (CTO) environmental clearances across air and water categories.
            </p>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded w-fit">
              Sector Code: Pollution
            </div>
          </div>

          {/* Factory Sector */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="p-3 bg-blue-100 text-blue-700 w-fit rounded-lg mb-4">
              <Factory className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Factory License & Registration</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Building plan approval, machinery installation verification, and statutory worker safety registration.
            </p>
            <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded w-fit">
              Sector Code: FactoryLicense
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="p-2 bg-white w-fit mx-auto rounded-lg shadow-sm text-gov-navy">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Fast-Track SLA</h4>
            <p className="text-xs text-slate-600">Strict statutory timelines for document verification.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-white w-fit mx-auto rounded-lg shadow-sm text-gov-navy">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Role-Based Security</h4>
            <p className="text-xs text-slate-600">Strict separation of Entrepreneur and Officer privileges.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-white w-fit mx-auto rounded-lg shadow-sm text-gov-navy">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">PAN & ID Validated</h4>
            <p className="text-xs text-slate-600">Zod-verified tax PAN formatting & official employee IDs.</p>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-white w-fit mx-auto rounded-lg shadow-sm text-gov-navy">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Audit Logging</h4>
            <p className="text-xs text-slate-600">Immutable trail of every application status change.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
