"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Building2, UserCheck } from "lucide-react";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      const user = data.data.user;
      const targetDestination =
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : user.role === "officer"
          ? "/dashboard/officer"
          : "/dashboard/entrepreneur";

      router.push(targetDestination);
      router.refresh();
    } catch (err: any) {
      setError("Network or server error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gov-navy px-6 py-6 text-white border-b border-gov-gold/30">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="w-6 h-6 text-gov-gold" />
          ANUMATI Secure Portal Login
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Single-Window gateway for industrial clearances, statutory roadmaps, and officer review consoles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="email">
            Official Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="entrepreneur@company.com or officer.boiler@gov.in"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy focus:border-gov-navy outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy focus:border-gov-navy outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-gov-navy hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            "Authenticating..."
          ) : (
            <>
              Sign In to Dashboard <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Quick-fill Access Pills */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Portal Access Profiles
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  email: "entrepreneur@company.com",
                  password: "Password123!",
                })
              }
              className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              Entrepreneur
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  email: "officer.boiler@gov.in",
                  password: "Password123!",
                })
              }
              className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              Clearance Officer
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gov-blue font-semibold hover:underline">
            Register Industrial Unit
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center text-sm text-slate-500">
          Loading Secure Portal Login...
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
