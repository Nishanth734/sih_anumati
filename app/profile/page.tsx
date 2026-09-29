"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import EntrepreneurProfileForm, { ProfileFormData } from "@/components/EntrepreneurProfileForm";
import { Shield, Building2, RefreshCw, AlertTriangle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // 1. Session check
      const meRes = await fetch("/api/auth/me", { signal: controller.signal });
      const meData = await meRes.json();

      if (!meRes.ok || !meData.success || !meData.data?.user) {
        router.push("/login?callbackUrl=/profile");
        return;
      }

      if (meData.data.user.role !== "entrepreneur") {
        router.push("/dashboard/officer");
        return;
      }

      // 2. Profile fetch
      const res = await fetch("/api/profile", { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.data?.profile) {
        setProfile(data.data.profile);
      } else {
        setError(data.error || "Failed to load company profile.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Profile request timed out. Please check your connection and retry.");
      } else {
        setError("Network error while loading industrial profile.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setError("Loading operation timed out.");
      }
    }, 5000);

    fetchProfile();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
        <RefreshCw className="w-8 h-8 text-gov-navy animate-spin" />
        <p className="font-medium text-slate-700">Fetching verified industrial profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
          <div className="p-3 bg-red-100 text-red-700 w-fit mx-auto rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Profile Load Failure</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchProfile()}
            className="px-4 py-2 bg-gov-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Loading Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gov-navy" /> Company & Industrial Profile Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Update your registered business credentials, tax PAN, GSTIN / Udyam number, and official address.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
          <Shield className="w-4 h-4 text-gov-gold" /> Official Government Single Window Portal
        </div>
      </div>

      <EntrepreneurProfileForm
        initialProfile={profile}
        onSaveSuccess={(updated) => setProfile(updated)}
      />
    </div>
  );
}
