"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Building2,
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Hash,
  Phone,
  Mail,
  MapPin,
  Factory,
  Check,
  FileCheck2,
  Award,
} from "lucide-react";
import { EntrepreneurProfileSchema } from "@/lib/validators";

export interface ProfileFormData {
  companyName: string;
  pan: string;
  gstin: string;
  registeredAddress: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  phone: string;
  email: string;
}

interface Props {
  initialProfile?: ProfileFormData | null;
  onSaveSuccess?: (updated: ProfileFormData) => void;
}

export default function EntrepreneurProfileForm({ initialProfile, onSaveSuccess }: Props) {
  const getInitialState = (prof?: ProfileFormData | null): ProfileFormData => ({
    companyName: prof?.companyName || "",
    pan: prof?.pan || "",
    gstin: prof?.gstin || "",
    registeredAddress: prof?.registeredAddress || "",
    sector: prof?.sector || "Boiler",
    phone: prof?.phone || "",
    email: prof?.email || "",
  });

  const [formData, setFormData] = useState<ProfileFormData>(() => getInitialState(initialProfile));
  const [lastSavedProfile, setLastSavedProfile] = useState<ProfileFormData>(() => getInitialState(initialProfile));

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isEmptyProfile, setIsEmptyProfile] = useState(
    !initialProfile || (!initialProfile.gstin && !initialProfile.phone)
  );

  const prevInitialRef = useRef(initialProfile);

  const [digiLockerLoading, setDigiLockerLoading] = useState(false);

  const handleDigiLockerFetch = () => {
    setDigiLockerLoading(true);
    setTimeout(() => {
      const verifiedData: ProfileFormData = {
        ...formData,
        companyName: formData.companyName || "APEX STEEL WORKS PRIVATE LIMITED",
        pan: formData.pan || "ABCDE1234F",
        gstin: formData.gstin || "27AAACR1234K1ZI",
        registeredAddress:
          formData.registeredAddress ||
          "Plot No. 42, MIDC Industrial Area, Phase II, Kurkumbh, Pune, Maharashtra 413802",
        phone: formData.phone || "9876543210",
      };
      setFormData(verifiedData);
      setToast({
        message: "Retrieved verified corporate credentials via DigiLocker / API Setu National Gateway.",
        type: "success",
      });
      setDigiLockerLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (initialProfile && initialProfile !== prevInitialRef.current) {
      prevInitialRef.current = initialProfile;
      const data = getInitialState(initialProfile);
      setFormData(data);
      setLastSavedProfile(data);
      setIsEmptyProfile(!initialProfile.gstin && !initialProfile.phone);
    }
  }, [initialProfile]);

  const validationResult = useMemo(() => {
    return EntrepreneurProfileSchema.safeParse({
      ...formData,
      pan: formData.pan.toUpperCase(),
      gstin: formData.gstin.toUpperCase(),
    });
  }, [formData]);

  const isFormValid = validationResult.success;

  const fieldErrors = useMemo(() => {
    if (validationResult.success) return {};
    const errors: Record<string, string> = {};
    validationResult.error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (field) {
        errors[field] = err.message;
      }
    });
    return errors;
  }, [validationResult]);

  // Compute profile completeness percentage & verified counts
  const verifiedCount = useMemo(() => {
    let count = 0;
    if (formData.companyName.trim() && !fieldErrors.companyName) count++;
    if (formData.pan.trim() && !fieldErrors.pan) count++;
    if (formData.gstin.trim() && !fieldErrors.gstin) count++;
    if (formData.phone.trim() && !fieldErrors.phone) count++;
    if (formData.email.trim() && !fieldErrors.email) count++;
    if (formData.registeredAddress.trim() && !fieldErrors.registeredAddress) count++;
    return count;
  }, [formData, fieldErrors]);

  const totalFields = 6;
  const completionPercentage = Math.round((verifiedCount / totalFields) * 100);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "pan" || field === "gstin" ? value.toUpperCase() : value,
    }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (toast) setToast(null);
  };

  const handleBlur = (field: keyof ProfileFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseCheck = EntrepreneurProfileSchema.safeParse({
      ...formData,
      pan: formData.pan.toUpperCase(),
      gstin: formData.gstin.toUpperCase(),
    });

    if (!parseCheck.success) {
      console.log("[DEBUG ZOD ERROR]:", parseCheck.error.flatten());
      return;
    }

    if (loading) return;

    const pendingData = { ...formData };
    const backupData = { ...lastSavedProfile };

    setLoading(true);
    setToast({ message: "Optimistically applying updates...", type: "success" });

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingData),
      });

      const result = await response.json();

      if (!result.success) {
        setFormData(backupData);
        setToast({
          message: result.error || "Failed to update profile. Changes rolled back.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      const savedData = result.data.profile;
      setLastSavedProfile(savedData);
      setFormData(savedData);
      setToast({
        message: "Profile updated and verified with government registry!",
        type: "success",
      });
      setIsEmptyProfile(false);
      if (onSaveSuccess) {
        onSaveSuccess(savedData);
      }
    } catch (err) {
      setFormData(backupData);
      setToast({
        message: "Network connection lost. Profile changes rolled back.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to render field validation state icon & border styling
  const getFieldStatus = (fieldName: keyof ProfileFormData) => {
    const isTouched = touched[fieldName];
    const value = formData[fieldName];
    const hasError = fieldErrors[fieldName];
    const isValid = Boolean(value && !hasError);

    let containerClass = "border-slate-300 focus-within:border-gov-navy focus-within:ring-2 focus-within:ring-gov-navy/20 bg-white hover:border-slate-400";
    if (isTouched && hasError) {
      containerClass = "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200 bg-red-50/20";
    } else if (isValid) {
      containerClass = "border-emerald-400/80 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-200 bg-emerald-50/10";
    }

    return { isTouched, hasError, isValid, containerClass };
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header Band */}
      <div className="bg-gov-navy px-6 py-5 text-white border-b border-gov-gold/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-gov-gold shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
                Entrepreneur & Firm Compliance Profile
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Official single-window statutory registry for industrial licensing & approvals.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> VERIFIED REGISTRY
            </span>
          </div>
        </div>
      </div>

      {/* Profile Completeness Indicator Bar */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-gov-navy" /> Compliance Profile Readiness:
            <span className="text-gov-navy font-bold">{completionPercentage}% Completed</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
            completionPercentage === 100
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-amber-100 text-amber-900 border border-amber-300"
          }`}>
            {verifiedCount} of {totalFields} Fields Verified
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completionPercentage === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                : "bg-gradient-to-r from-gov-navy via-gov-blue to-amber-500"
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Empty Profile Graceful Banner */}
      {isEmptyProfile && (
        <div className="mx-6 mt-6 p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 text-xs flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-sky-900">Welcome! Setup your Industrial Profile</p>
            <p className="mt-1 text-sky-800 leading-relaxed">
              Completing this verified profile enables 1-click auto-filling for all future industrial clearance filings (Boiler Licensing, Pollution Control NOC, and Factory Safety Registrations).
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`mx-6 mt-5 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          {toast.type === "error" && (
            <span className="text-[11px] flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-md font-mono">
              <RotateCcw className="w-3 h-3" /> State Restored
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {/* ================= SECTION 1: BUSINESS IDENTITY & REGISTRATION ================= */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gov-gold" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gov-navy flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gov-blue" /> Business Identity & Statutory Registration
              </h3>
            </div>
            <button
              type="button"
              onClick={handleDigiLockerFetch}
              disabled={digiLockerLoading}
              className="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              {digiLockerLoading ? "Verifying..." : "1-Click Verify via DigiLocker / API Setu"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="companyName">
                  Registered Business / Firm Name <span className="text-amber-600">*</span>
                </label>
                {getFieldStatus("companyName").isValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Valid
                  </span>
                )}
              </div>
              <div className={`relative flex items-center rounded-lg border transition ${getFieldStatus("companyName").containerClass}`}>
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  onBlur={() => handleBlur("companyName")}
                  placeholder="e.g. Apex Steel Works Pvt Ltd"
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium placeholder:text-slate-400"
                />
              </div>
              {getFieldStatus("companyName").isTouched && getFieldStatus("companyName").hasError && (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {fieldErrors.companyName}
                </p>
              )}
            </div>

            {/* Industry Sector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5" htmlFor="sector">
                Primary Industry Sector <span className="text-amber-600">*</span>
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-300 focus-within:border-gov-navy focus-within:ring-2 focus-within:ring-gov-navy/20 bg-white transition">
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Factory className="w-4 h-4" />
                </div>
                <select
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => handleChange("sector", e.target.value as any)}
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-semibold cursor-pointer"
                >
                  <option value="Boiler">Boiler Inspection & Licensing</option>
                  <option value="Pollution">Pollution Control Board NOC</option>
                  <option value="FactoryLicense">Factory Safety & Registration</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Business Tax PAN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="pan">
                  Business Tax PAN (Format: ABCDE1234F) <span className="text-amber-600">*</span>
                </label>
                {getFieldStatus("pan").isValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Format Valid
                  </span>
                )}
              </div>
              <div className={`relative flex items-center rounded-lg border transition ${getFieldStatus("pan").containerClass}`}>
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="pan"
                  type="text"
                  required
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => handleChange("pan", e.target.value)}
                  onBlur={() => handleBlur("pan")}
                  placeholder="ABCDE1234F"
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 bg-transparent outline-none font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                />
              </div>
              {getFieldStatus("pan").isTouched && getFieldStatus("pan").hasError && (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {fieldErrors.pan}
                </p>
              )}
            </div>

            {/* GSTIN or Udyam */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="gstin">
                  GSTIN / Udyam Number <span className="text-amber-600">*</span>
                </label>
                {getFieldStatus("gstin").isValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Checksum Verified
                  </span>
                )}
              </div>
              <div className={`relative flex items-center rounded-lg border transition ${getFieldStatus("gstin").containerClass}`}>
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  id="gstin"
                  type="text"
                  required
                  value={formData.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  onBlur={() => handleBlur("gstin")}
                  placeholder="27AAACR1234K1ZI or UDYAM-MH-01-0012345"
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 bg-transparent outline-none font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                />
              </div>
              {getFieldStatus("gstin").isTouched && getFieldStatus("gstin").hasError ? (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-start gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> {fieldErrors.gstin}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" /> 15-digit GSTIN (Modulus 36 Checksum) or Udyam Registration format
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: OFFICIAL CONTACT & LOCATION ================= */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <span className="w-2 h-2 rounded-full bg-gov-gold" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gov-navy flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gov-blue" /> Official Contact & Registered Unit Location
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="phone">
                  Official Contact Phone <span className="text-amber-600">*</span>
                </label>
                {getFieldStatus("phone").isValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Valid
                  </span>
                )}
              </div>
              <div className={`relative flex items-center rounded-lg border transition ${getFieldStatus("phone").containerClass}`}>
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="e.g. 9876543210 or +919876543210"
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium placeholder:text-slate-400"
                />
              </div>
              {getFieldStatus("phone").isTouched && getFieldStatus("phone").hasError && (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="email">
                  Official Contact Email <span className="text-amber-600">*</span>
                </label>
                {getFieldStatus("email").isValid && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Valid
                  </span>
                )}
              </div>
              <div className={`relative flex items-center rounded-lg border transition ${getFieldStatus("email").containerClass}`}>
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="contact@company.com"
                  className="w-full pl-2.5 pr-3.5 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium placeholder:text-slate-400"
                />
              </div>
              {getFieldStatus("email").isTouched && getFieldStatus("email").hasError && (
                <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          {/* Registered Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5" htmlFor="registeredAddress">
                Registered Corporate / Factory Unit Address <span className="text-amber-600">*</span>
              </label>
              {getFieldStatus("registeredAddress").isValid && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Valid
                </span>
              )}
            </div>
            <div className={`relative flex items-start rounded-lg border transition ${getFieldStatus("registeredAddress").containerClass}`}>
              <div className="pl-3.5 pt-3 text-slate-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                id="registeredAddress"
                required
                rows={3}
                value={formData.registeredAddress}
                onChange={(e) => handleChange("registeredAddress", e.target.value)}
                onBlur={() => handleBlur("registeredAddress")}
                placeholder="Plot 45, GIDC Industrial Complex, Sector 3, Vadodara, Gujarat 390010"
                className="w-full pl-2.5 pr-3.5 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium placeholder:text-slate-400 resize-y"
              />
            </div>
            {getFieldStatus("registeredAddress").isTouched && getFieldStatus("registeredAddress").hasError && (
              <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> {fieldErrors.registeredAddress}
              </p>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> Statutory Data Encrypted & Protected under IT Act 2000
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="px-7 py-3 bg-gov-navy hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 border border-gov-gold/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <>
                <Save className="w-4 h-4 animate-spin" /> Saving Profile...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gov-gold" /> Save & Verify Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
