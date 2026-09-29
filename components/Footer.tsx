import Link from "next/link";
import { Shield, FileCheck, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
              <Shield className="w-4 h-4 text-amber-400" /> ANUMATI Industrial Approval System
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Official Single Window Clearance & Regulatory Compliance Gateway for State & Central Industrial Development.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Approved Industry Sectors</h4>
            <ul className="space-y-1 text-slate-400">
              <li className="flex items-center gap-1.5"><FileCheck className="w-3 h-3 text-sky-400" /> Boiler Inspection & Operational License</li>
              <li className="flex items-center gap-1.5"><FileCheck className="w-3 h-3 text-sky-400" /> Pollution Control Board (NOC / CTE / CTO)</li>
              <li className="flex items-center gap-1.5"><FileCheck className="w-3 h-3 text-sky-400" /> Factory Registration & Safety Clearance</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Security & Audit Standard</h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              All transactions are cryptographically signed and logged into immutable audit traces.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-1 rounded">
              ISO 27001 Security Compliant <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-slate-500">
          &copy; {new Date().getFullYear()} ANUMATI Industrial Clearance Platform. All Rights Reserved. Government of India Enterprise.
        </div>
      </div>
    </footer>
  );
}
