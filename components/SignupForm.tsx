"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck, Building2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<"entrepreneur" | "officer">("entrepreneur");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    sector: "Boiler",
    pan: "",
    companyName: "",
    businessAddress: "",
    employeeId: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: "entrepreneur" | "officer") => {
    setRole(newRole);
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setGeneralError(null);

    const payload =
      role === "entrepreneur"
        ? {
            role: "entrepreneur",
            name: formData.name,
            email: formData.email,
            password: formData.password,
            sector: formData.sector,
            pan: formData.pan.toUpperCase(),
            companyName: formData.companyName,
            businessAddress: formData.businessAddress,
          }
        : {
            role: "officer",
            name: formData.name,
            email: formData.email,
            password: formData.password,
            sector: formData.sector,
            employeeId: formData.employeeId,
          };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.details && typeof data.details === "object") {
          setFieldErrors(data.details);
        }
        setGeneralError(data.error || "Signup failed. Please fix validation errors.");
        setLoading(false);
        return;
      }

      if (role === "officer") {
        router.push("/dashboard/officer");
      } else {
        router.push("/dashboard/entrepreneur");
      }
      router.refresh();
    } catch (err: any) {
      setGeneralError("Network or server connection failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gov-navy px-6 py-6 text-white border-b border-gov-gold/30">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="w-6 h-6 text-gov-gold" />
          ANUMATI Industrial Portal Registration
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Select your registration role to proceed with single-window verification.
        </p>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/10 rounded-lg">
          <button
            type="button"
            onClick={() => handleRoleChange("entrepreneur")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition ${
              role === "entrepreneur" ? "bg-white text-gov-navy shadow" : "text-slate-200 hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" /> Entrepreneur / Industrialist
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("officer")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition ${
              role === "officer" ? "bg-white text-gov-navy shadow" : "text-slate-200 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Government Officer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>{generalError}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="name">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={role === "entrepreneur" ? "e.g. Rajesh Sharma" : "e.g. Dr. A. P. Varma"}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                fieldErrors.name ? "border-red-500 bg-red-50/50" : "border-slate-300"
              }`}
            />
            {fieldErrors.name && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="email">
              Official Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={role === "entrepreneur" ? "rajesh@industries.com" : "officer@gov.in"}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                fieldErrors.email ? "border-red-500 bg-red-50/50" : "border-slate-300"
              }`}
            />
            {fieldErrors.email && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
              Password (Min 8 chars) *
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                fieldErrors.password ? "border-red-500 bg-red-50/50" : "border-slate-300"
              }`}
            />
            {fieldErrors.password && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="sector">
              Industry Sector *
            </label>
            <select
              id="sector"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none bg-white ${
                fieldErrors.sector ? "border-red-500 bg-red-50/50" : "border-slate-300"
              }`}
            >
              <option value="Boiler">Boiler Licensing & Safety</option>
              <option value="Pollution">Pollution Control Board NOC</option>
              <option value="FactoryLicense">Factory Registration & Compliance</option>
            </select>
            {fieldErrors.sector && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.sector}</p>}
          </div>
        </div>

        {/* Entrepreneur Specific Fields */}
        {role === "entrepreneur" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="pan">
                  Business PAN (Format: ABCDE1234F) *
                </label>
                <input
                  id="pan"
                  type="text"
                  required
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className={`w-full px-3 py-2 text-sm border font-mono rounded-lg focus:ring-2 focus:ring-gov-navy outline-none uppercase ${
                    fieldErrors.pan ? "border-red-500 bg-red-50/50" : "border-slate-300"
                  }`}
                />
                {fieldErrors.pan && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.pan}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="companyName">
                  Company / Firm Name *
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Apex Steel Industries Pvt Ltd"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                    fieldErrors.companyName ? "border-red-500 bg-red-50/50" : "border-slate-300"
                  }`}
                />
                {fieldErrors.companyName && (
                  <p className="text-[11px] text-red-600 mt-1">{fieldErrors.companyName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="businessAddress">
                Registered Factory / Unit Address *
              </label>
              <textarea
                id="businessAddress"
                required
                rows={2}
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="Plot 45, Industrial Estate, Phase II, Sector 5"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                  fieldErrors.businessAddress ? "border-red-500 bg-red-50/50" : "border-slate-300"
                }`}
              />
              {fieldErrors.businessAddress && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.businessAddress}</p>
              )}
            </div>
          </>
        )}

        {/* Officer Specific Fields */}
        {role === "officer" && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="employeeId">
              Government Officer Employee ID *
            </label>
            <input
              id="employeeId"
              type="text"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="GOV-OFF-7892"
              className={`w-full px-3 py-2 text-sm border font-mono rounded-lg focus:ring-2 focus:ring-gov-navy outline-none ${
                fieldErrors.employeeId ? "border-red-500 bg-red-50/50" : "border-slate-300"
              }`}
            />
            {fieldErrors.employeeId && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.employeeId}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-2.5 px-4 bg-gov-navy hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            "Creating Account..."
          ) : (
            <>
              Complete Registration <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="text-gov-blue font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </form>
    </div>
  );
}
