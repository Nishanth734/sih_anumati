"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
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
      if (user.role === "officer") {
        router.push("/dashboard/officer");
      } else {
        router.push("/dashboard/entrepreneur");
      }
      router.refresh();
    } catch (err: any) {
      setError("Network or server error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gov-navy px-6 py-5 text-white">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="w-5 h-5 text-gov-gold" />
          ANUMATI Secure Portal Login
        </div>
        <p className="text-xs text-slate-300 mt-1">Access your industrial licenses, clearances, or officer queue.</p>
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
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="officer@gov.in or entrepreneur@company.com"
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
          className="w-full mt-2 py-2.5 px-4 bg-gov-navy hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            "Authenticating..."
          ) : (
            <>
              Sign In to Dashboard <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gov-blue font-semibold hover:underline">
            Register New Account
          </Link>
        </div>
      </form>
    </div>
  );
}
