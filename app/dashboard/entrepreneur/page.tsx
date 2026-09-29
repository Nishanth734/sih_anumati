"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  PlusCircle,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  MapPin,
  Flame,
  Wind,
  Factory,
  Sparkles,
  UserCheck,
  UploadCloud,
  RefreshCw,
  LogOut,
} from "lucide-react";
import RecommendedSchemes from "@/components/RecommendedSchemes";

interface ApplicationItem {
  _id: string;
  applicationNumber: string;
  title: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  description: string;
  estimatedBudget: number;
  plantLocation: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ADDITIONAL_INFO_REQUIRED";
  remarks?: string;
  createdAt: string;
}

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: "entrepreneur";
  sector: string;
  pan?: string;
  companyName?: string;
}

interface ProfileData {
  companyName?: string;
  pan?: string;
  gstin?: string;
  registeredAddress?: string;
  sector?: "Boiler" | "Pollution" | "FactoryLicense";
  phone?: string;
  email?: string;
}

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    sector: "Boiler",
    description: "",
    estimatedBudget: "",
    plantLocation: "",
  });

  const [autofilledFields, setAutofilledFields] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      // Create AbortController with 5s timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // 1. Session verification check
      const meRes = await fetch("/api/auth/me", { signal: controller.signal });
      clearTimeout(timeoutId);

      const meData = await meRes.json();

      if (!meRes.ok || !meData.success || !meData.data?.user) {
        console.warn("[Dashboard Auth] Session unauthenticated or expired.");
        setAuthError("Session expired or unauthenticated. Please log in again.");
        router.push("/login?callbackUrl=/dashboard/entrepreneur");
        return;
      }

      const sessionUser = meData.data.user;

      if (sessionUser.role !== "entrepreneur") {
        console.warn("[Dashboard Auth] Role mismatch for entrepreneur route.");
        router.push("/dashboard/officer");
        return;
      }

      setUser(sessionUser);

      // 2. Fetch Profile for auto-population (non-blocking errors)
      try {
        const profRes = await fetch("/api/profile");
        const profData = await profRes.json();
        if (profData.success && profData.data?.profile) {
          setProfile(profData.data.profile);
        }
      } catch (err) {
        console.warn("[Dashboard] Non-critical profile load issue:", err);
      }

      // 3. Fetch Applications (non-blocking errors)
      try {
        const appRes = await fetch("/api/applications");
        const appData = await appRes.json();
        if (appData.success) {
          setApplications(appData.data.applications || []);
        }
      } catch (err) {
        console.warn("[Dashboard] Non-critical applications load issue:", err);
      }
    } catch (err: any) {
      console.error("[Dashboard] Session check error:", err);
      if (err.name === "AbortError") {
        setAuthError("Session check timed out. Please check your connection or log in again.");
      } else {
        setAuthError("Failed to authenticate session. Please log in.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: force loading to false if session check hangs longer than 5 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[Dashboard] Safety timeout triggered. Terminating spinner.");
        setLoading(false);
        setAuthError("Session check timed out. Please log in again.");
      }
    }, 5000);

    fetchData().finally(() => {
      clearTimeout(safetyTimer);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [fetchData]);

  // New Application Modal Extraction & Verification States
  const [modalStep, setModalStep] = useState<"UPLOAD" | "REVIEW" | "MANUAL">("UPLOAD");
  const [extracting, setExtracting] = useState(false);
  const [extractionInfo, setExtractionInfo] = useState<{
    method: "PDF_TEXT_EXTRACTION" | "OCR";
    confidence: number;
  } | null>(null);
  const [flaggedFields, setFlaggedFields] = useState<string[]>([]);

  const handleOpenModal = () => {
    const autofills: Record<string, boolean> = {};
    let initialSector = user?.sector || "Boiler";
    let initialLocation = "";

    if (profile) {
      if (profile.sector) {
        initialSector = profile.sector;
        autofills.sector = true;
      }
      if (profile.registeredAddress) {
        initialLocation = profile.registeredAddress;
        autofills.plantLocation = true;
      }
    }

    setFormData({
      title: "",
      sector: initialSector,
      description: "",
      estimatedBudget: "",
      plantLocation: initialLocation,
    });
    setAutofilledFields(autofills);
    setFormError(null);
    setExtractionInfo(null);
    setFlaggedFields([]);
    setModalStep("UPLOAD");
    setShowModal(true);
  };

  const handleDocumentExtract = async (file: File) => {
    setFormError(null);
    setExtracting(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/applications/extract", {
        method: "POST",
        body: uploadData,
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        setFormError(json.error || "Failed to extract data from document.");
        setExtracting(false);
        return;
      }

      const { extractionMethod, overallConfidence, extractedFields, flaggedFields: flags } = json.data;

      setExtractionInfo({
        method: extractionMethod,
        confidence: overallConfidence,
      });
      setFlaggedFields(flags || []);

      setFormData({
        title: extractedFields.title || "",
        sector: extractedFields.sector || user?.sector || "Boiler",
        description: extractedFields.description || "",
        estimatedBudget: extractedFields.estimatedBudget ? String(extractedFields.estimatedBudget) : "",
        plantLocation: extractedFields.plantLocation || profile?.registeredAddress || "",
      });

      setModalStep("REVIEW");
    } catch (err: any) {
      setFormError("Failed to extract data from file due to network error.");
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const submissionMethod =
      modalStep === "MANUAL"
        ? "MANUAL"
        : extractionInfo?.method || "PDF_TEXT_EXTRACTION";

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimatedBudget: parseFloat(formData.estimatedBudget),
          submissionMethod,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setFormError(data.error || "Failed to submit clearance application.");
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
          </span>
        );
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Ready for Review
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Under Review
          </span>
        );
      case "RETURNED_TO_APPLICANT":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Upload
          </span>
        );
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case "Boiler":
        return <Flame className="w-4 h-4 text-amber-600" />;
      case "Pollution":
        return <Wind className="w-4 h-4 text-emerald-600" />;
      default:
        return <Factory className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-500 text-sm">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="font-medium text-slate-400">Loading Entrepreneur Portal...</p>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto px-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900">Session Expired or Unauthenticated</h3>
          <p className="text-xs text-slate-600 mt-1">
            {authError || "Please log in to access your Entrepreneur Dashboard."}
          </p>
        </div>
        <Link
          href="/login?callbackUrl=/dashboard/entrepreneur"
          className="px-5 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow transition flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log In to Portal
        </Link>
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === "PENDING" || a.status === "UNDER_REVIEW").length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED" || a.status === "RETURNED_TO_APPLICANT").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gov-navy font-bold text-xl">
            <Building2 className="w-6 h-6 text-gov-blue" />
            Entrepreneur Portal Dashboard
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Welcome, <span className="font-semibold text-slate-900">{user?.name}</span> &bull;{" "}
            <span className="font-medium text-gov-navy">{profile?.companyName || user?.companyName || "Industrial Unit"}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">PAN: {profile?.pan || user?.pan || "N/A"}</span>
            {profile?.gstin && (
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">GSTIN/Udyam: {profile.gstin}</span>
            )}
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">Sector: {profile?.sector || user?.sector}</span>
            <Link href="/profile" className="text-gov-blue hover:underline font-semibold ml-2 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Edit Compliance Profile
            </Link>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-gov-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-gov-gold" /> File New Application
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Filings</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{applications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">In Progress / Pending</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Approved Licenses</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Action Needed / Rejected</p>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-navy" /> Clearance Applications History
          </h3>
          <span className="text-xs text-slate-500">Showing {applications.length} items</span>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">No clearance applications filed yet.</p>
            <button
              onClick={handleOpenModal}
              className="text-xs text-gov-blue font-semibold hover:underline"
            >
              File your first application now &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">App Number</th>
                  <th className="px-6 py-3">Title & Details</th>
                  <th className="px-6 py-3">Sector</th>
                  <th className="px-6 py-3">Budget & Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date Filed</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-gov-navy">
                      {app.applicationNumber}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{app.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{app.description}</p>
                      {app.remarks && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-1 rounded mt-1 border border-amber-200">
                          Officer Remark: {app.remarks}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-medium text-[11px]">
                        {getSectorIcon(app.sector)} {app.sector}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" /> ₹{app.estimatedBudget.toLocaleString("en-IN")}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {app.plantLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/application/${app._id}/upload`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gov-navy hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-gov-gold" /> Upload Docs
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommended Government Incentive Schemes */}
      <RecommendedSchemes userSector={(profile?.sector || user?.sector || "Boiler") as any} />

      {/* New Application Modal: Step 1 (Upload PDF/Image) -> Step 2 (Editable Review with OCR Badges) -> Fallback (Manual) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gov-navy px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-gov-gold" /> File New Industrial Clearance Application
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {modalStep === "UPLOAD" && "Step 1 of 2: Upload Filled Application Document"}
                  {modalStep === "REVIEW" && "Step 2 of 2: Review & Confirm Auto-Extracted Details"}
                  {modalStep === "MANUAL" && "Manual Application Entry Form"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-300 hover:text-white text-xs font-bold p-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              {/* STEP 1: DOCUMENT UPLOAD */}
              {modalStep === "UPLOAD" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Automated Document Reader
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Upload a PDF or image of your filled statutory application form (digitally typed or scanned).
                      Digital PDFs extract text directly; scanned forms utilize Tesseract OCR (English, Hindi, Marathi).
                    </p>
                  </div>

                  {extracting ? (
                    <div className="border-2 border-dashed border-amber-400 bg-amber-50/40 rounded-xl p-8 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Processing Document Extraction...</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Checking PDF Text Layer &bull; Tesseract OCR Reader &bull; Extracting Application Fields
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 hover:border-gov-navy bg-slate-50/50 hover:bg-slate-100/50 rounded-xl p-8 text-center transition cursor-pointer group">
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-slate-200 text-slate-600 group-hover:bg-gov-navy group-hover:text-gov-gold transition">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-gov-navy transition">
                            Drop filled application document here or click to browse
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Supports PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleDocumentExtract(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => setModalStep("MANUAL")}
                      className="text-xs text-gov-blue font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Prefer to type application details manually? Click here &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: EDITABLE REVIEW FORM WITH CONFIDENCE BADGES */}
              {modalStep === "REVIEW" && (
                <form onSubmit={handleCreateApplication} className="space-y-4">
                  {/* Extraction Badge Banner */}
                  {extractionInfo && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        extractionInfo.method === "PDF_TEXT_EXTRACTION"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {extractionInfo.method === "PDF_TEXT_EXTRACTION" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold">
                            {extractionInfo.method === "PDF_TEXT_EXTRACTION"
                              ? "⚡ Auto-Extracted via Digital PDF Text Layer (100% Accuracy)"
                              : `🔍 Auto-Extracted via Tesseract OCR (${extractionInfo.confidence}% Confidence)`}
                          </span>
                          <p className="text-[11px] text-slate-600">
                            {flaggedFields.length > 0
                              ? `${flaggedFields.length} field(s) marked for mandatory manual review below.`
                              : "All fields extracted successfully. Please review before submission."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setModalStep("UPLOAD")}
                        className="text-[11px] font-semibold underline text-slate-700 hover:text-slate-900 shrink-0"
                      >
                        Re-upload File
                      </button>
                    </div>
                  )}

                  {/* Title Field */}
                  <div
                    className={`p-3 rounded-lg transition ${
                      flaggedFields.includes("title")
                        ? "bg-amber-50/60 border border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Application Title / Purpose *
                      </label>
                      {flaggedFields.includes("title") && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                          ⚠️ Low Confidence — Please Verify
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. 50 Ton Boiler Operational Clearance Phase-1"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  {/* Sector Field */}
                  <div
                    className={`p-3 rounded-lg transition ${
                      flaggedFields.includes("sector")
                        ? "bg-amber-50/60 border border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Target Industry Sector *</label>
                      {flaggedFields.includes("sector") && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                          ⚠️ Low Confidence — Please Verify
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none bg-white"
                    >
                      <option value="Boiler">Boiler Licensing & Safety</option>
                      <option value="Pollution">Pollution Control Board NOC</option>
                      <option value="FactoryLicense">Factory Registration & Compliance</option>
                    </select>
                  </div>

                  {/* Capital Investment Field */}
                  <div
                    className={`p-3 rounded-lg transition ${
                      flaggedFields.includes("estimatedBudget")
                        ? "bg-amber-50/60 border border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Estimated Plant / Unit Capital Investment (₹ INR) *
                      </label>
                      {flaggedFields.includes("estimatedBudget") && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                          ⚠️ Low Confidence — Please Verify
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                      placeholder="15000000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  {/* Plant Location Field */}
                  <div
                    className={`p-3 rounded-lg transition ${
                      flaggedFields.includes("plantLocation")
                        ? "bg-amber-50/60 border border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Plant / Installation Address *
                      </label>
                      {flaggedFields.includes("plantLocation") && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                          ⚠️ Low Confidence — Please Verify
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.plantLocation}
                      onChange={(e) => setFormData({ ...formData, plantLocation: e.target.value })}
                      placeholder="Plot 88, Industrial Complex, GIDC"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  {/* Technical Description Field */}
                  <div
                    className={`p-3 rounded-lg transition ${
                      flaggedFields.includes("description")
                        ? "bg-amber-50/60 border border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Technical Description & Specifications *
                      </label>
                      {flaggedFields.includes("description") && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                          ⚠️ Low Confidence — Please Verify
                        </span>
                      )}
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide technical specifications, safety protocols, and equipment details..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep("UPLOAD")}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Back to Upload
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-gov-navy text-white text-xs font-bold rounded-lg shadow hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submitting ? "Submitting Application..." : "Confirm & Submit Application"}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: MANUAL FORM FALLBACK */}
              {modalStep === "MANUAL" && (
                <form onSubmit={handleCreateApplication} className="space-y-4">
                  {(!profile || !profile.gstin) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center justify-between">
                      <span>💡 Complete your compliance profile to enable 1-click auto-fill.</span>
                      <Link href="/profile" className="font-bold text-amber-900 underline shrink-0 ml-2">
                        Setup Profile
                      </Link>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Application Title / Purpose *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. 50 Ton Boiler Operational Clearance Phase-1"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Target Industry Sector *</label>
                      {autofilledFields.sector && (
                        <span className="text-[10px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-sky-600" /> Auto-filled from Profile
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.sector}
                      onChange={(e) => {
                        setFormData({ ...formData, sector: e.target.value });
                        setAutofilledFields((prev) => ({ ...prev, sector: false }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none bg-white"
                    >
                      <option value="Boiler">Boiler Licensing & Safety</option>
                      <option value="Pollution">Pollution Control Board NOC</option>
                      <option value="FactoryLicense">Factory Registration & Compliance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Plant / Unit Capital Investment (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                      placeholder="5000000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Plant / Installation Address *</label>
                      {autofilledFields.plantLocation && (
                        <span className="text-[10px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-sky-600" /> Auto-filled from Profile
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.plantLocation}
                      onChange={(e) => {
                        setFormData({ ...formData, plantLocation: e.target.value });
                        setAutofilledFields((prev) => ({ ...prev, plantLocation: false }));
                      }}
                      placeholder="Plot 88, Industrial Complex, GIDC"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Technical Description & Equipment Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide technical specifications, safety protocols, and equipment details..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep("UPLOAD")}
                      className="text-xs text-gov-blue font-semibold hover:underline"
                    >
                      &larr; Switch to Document Upload
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded-lg shadow hover:bg-slate-800 disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
