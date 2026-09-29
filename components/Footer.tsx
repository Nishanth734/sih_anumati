import Link from "next/link";
import { ShieldCheck, FileCheck, ExternalLink, Compass, Layers, Bot, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Platform Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-gov-gold" />
              <span>ANUMATI Platform</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified Single-Window Statutory Clearance &amp; Regulatory Compliance Gateway for Indian industrial enterprises and manufacturing units.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/roadmap" className="hover:text-amber-300 transition flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-gov-gold" />
                  Statutory Roadmap
                </Link>
              </li>
              <li>
                <Link href="/pre-scrutiny" className="hover:text-emerald-300 transition flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  CAD Setback Pre-Scrutiny
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-amber-200 transition flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  Statutory AI Assistant
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition flex items-center gap-1.5">
                  Sign In to Dashboard
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition flex items-center gap-1.5 text-amber-300 font-medium">
                  Register Industrial Unit
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Statutory Departments */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Regulated Sectors</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>Directorate of Steam Boilers (Boilers Act 1923)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pollution Control Board (Water &amp; Air Acts)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Industrial Safety &amp; Health (Factories Act 1948)</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Standards & Security */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Trust &amp; Security</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every document is verified using dual-layer OCR extraction and Pinecone RAG statutory clause analysis with SHA-256 audit trails.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                ISO 27001
              </span>
              <span className="text-[10px] text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded">
                SHA-256 Audited
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                Kahn DAG
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; {new Date().getFullYear()} ANUMATI Industrial Single-Window Clearance Portal. Government of India.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Smart India Hackathon</span>
            <span>&bull;</span>
            <span className="text-slate-400">Ministry of Commerce &amp; Industry Framework</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
