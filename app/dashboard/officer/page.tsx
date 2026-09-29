"use client";

import RejectionAnalyticsPanel from "@/components/RejectionAnalyticsPanel";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  DollarSign,
  MapPin,
  Flame,
  Wind,
  Factory,
  MessageSquare,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Eye,
  FileSearch,
} from "lucide-react";

interface ApplicationItem {
  _id: string;
  applicationNumber: string;
  applicantName: string;
  companyName: string;
  title: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  description: string;
  estimatedBudget: number;
  plantLocation: string;
  status:
    | "PENDING"
    | "RETURNED_TO_APPLICANT"
    | "READY_FOR_REVIEW"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "ADDITIONAL_INFO_REQUIRED";
  remarks?: string;
  createdAt: string;
}

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: "officer";
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  employeeId?: string;
}

interface ComparisonField {
  fieldName: string;
  submittedValue: string;
  ocrExtractedValue: string;
  similarityScore: number;
  isMatch: boolean;
  isNearThresholdMismatch: boolean;
}

const COMMON_REJECTION_REASONS = [
  "Incomplete Site Layout Specification & Safety Distances",
  "Structural Safety & Load-Bearing Engineer Certificate Missing",
  "Environmental Effluent Discharge Non-Compliant with SPCB Norms",
  "Statutory Treasury Fee Payment Receipt Invalid or Unverified",
  "High Voltage Transformer Earthing & Machinery Guarding Audit Failed",
  "Custom Statutory Reason (Specify below)",
];

export default function OfficerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState("READY_FOR_REVIEW");

  // Selected Application for Decision Action
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reasonPreset, setReasonPreset] = useState(COMMON_REJECTION_REASONS[0]);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Side-by-Side OCR Comparison Detail Modal
  const [detailAppId, setDetailAppId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    application: any;
    profile: any;
    documents: any[];
    comparisons: ComparisonField[];
    overallOcrConfidence: number;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchQueue = useCallback(async () => {
    if (applications.length === 0) {
      setLoading(true);
    }
    setAuthError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const meRes = await fetch("/api/auth/me", { signal: controller.signal });
      clearTimeout(timeoutId);

      const meData = await meRes.json();

      if (!meRes.ok || !meData.success || !meData.data?.user) {
        setAuthError("Session expired or unauthenticated. Please log in.");
        router.push("/login?callbackUrl=/dashboard/officer");
        return;
      }

      if (meData.data.user.role !== "officer") {
        router.push("/dashboard/entrepreneur");
        return;
      }

      setUser(meData.data.user);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        sortBy,
        order: sortOrder,
        status: statusFilter,
      });

      const res = await fetch(`/api/applications?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.data.applications || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch (err: any) {
      console.error("Queue fetch error:", err);
      if (err.name === "AbortError") {
        setAuthError("Session check timed out.");
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Fetch Side-by-Side Comparison Details
  const handleOpenDetail = async (appId: string) => {
    setDetailAppId(appId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}/details`);
      const data = await res.json();
      if (data.success) {
        setDetailData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Approve / Reject Decision with Optimistic UI Update & Rollback
  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    const finalRemarks = decisionType === "REJECTED" ? remarks || reasonPreset : remarks;

    if (decisionType === "REJECTED" && (!finalRemarks || finalRemarks.trim().length < 5)) {
      setActionError("Mandatory Rejection Reason: Please select or enter a specific statutory reason.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    // Optimistic UI update: Backup current queue state and remove processed application from active view
    const previousQueue = [...applications];
    const previousPagination = { ...pagination };

    setApplications((prev) => prev.filter((a) => a._id !== selectedApp._id));
    setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    setToast({ message: "Optimistically committing statutory decision...", type: "success" });

    const targetAppId = selectedApp._id;
    const targetAppNumber = selectedApp.applicationNumber;

    setSelectedApp(null);

    try {
      const res = await fetch(`/api/applications/${targetAppId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decisionType,
          remarks: finalRemarks.trim(),
          reason: finalRemarks.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Rollback state on failure
        setApplications(previousQueue);
        setPagination(previousPagination);
        setToast({
          message: data.error || "Decision failed. Queue state restored.",
          type: "error",
        });
        setActionLoading(false);
        return;
      }

      setToast({
        message: `Application ${targetAppNumber} successfully ${
          decisionType === "APPROVED" ? "APPROVED (License Granted)" : "REJECTED"
        }! Decision logged to statutory Audit Trail.`,
        type: "success",
      });

      setRemarks("");
      fetchQueue();
    } catch (err) {
      // Rollback state on network error
      setApplications(previousQueue);
      setPagination(previousPagination);
      setToast({
        message: "Network Error: Statutory decision failed. Queue state restored.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
          </span>
        );
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sky-100 text-sky-900 px-2.5 py-1 rounded-full border border-sky-300 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Ready for Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer Desk Header */}
      <div className="bg-gov-navy text-white p-6 rounded-xl shadow-lg border border-gov-gold/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 font-extrabold text-xl">
            <UserCheck className="w-6 h-6 text-gov-gold" />
            Government Officer Approval Desk
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Officer: <span className="font-semibold text-white">{user?.name}</span> &bull; Employee ID:{" "}
            <span className="font-mono text-amber-300">{user?.employeeId || "GOV-OFF-101"}</span>
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-md text-xs font-semibold text-amber-300 font-mono">
            Assigned Sector: {user?.sector || "Boiler"} Authority
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          {toast.type === "error" && (
            <span className="text-[11px] flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded font-mono">
              <RotateCcw className="w-3 h-3" /> State Restored
            </span>
          )}
        </div>
      )}

      {/* Rejection Analytics Panel */}
      <RejectionAnalyticsPanel />

      {/* Controls & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Applicant, Firm or App ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gov-navy"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="READY_FOR_REVIEW">Queue: Ready for Review</option>
            <option value="APPROVED">History: Approved</option>
            <option value="REJECTED">History: Rejected</option>
            <option value="ALL">All Sector Applications</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="applicantName">Sort by Applicant Name</option>
            <option value="estimatedBudget">Sort by Investment Budget</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-slate-600"
            title="Toggle Sort Direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gov-navy" /> Assigned Review Queue &bull; {user?.sector} Sector
          </h3>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Showing {applications.length} of {pagination.total} cases
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gov-navy border-t-transparent mb-2" />
            <p>Fetching sector applications queue...</p>
          </div>
        ) : applications.length === 0 ? (
          /* Empty Queue State */
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">Officer Review Queue Clear</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All statutory applications in your assigned sector ({user?.sector}) have been processed or are currently pending applicant verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">App ID & Date</th>
                  <th className="px-6 py-3">Applicant & Firm Name</th>
                  <th className="px-6 py-3">Clearance Specs</th>
                  <th className="px-6 py-3">Investment & Location</th>
                  <th className="px-6 py-3">Queue Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <p className="font-mono font-bold text-gov-navy">{app.applicationNumber}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {app.companyName}
                      </p>
                      <p className="text-[11px] text-slate-500">Applicant: {app.applicantName}</p>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{app.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{app.description}</p>
                      {app.remarks && (
                        <p className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200 flex items-center gap-1 font-mono">
                          <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" /> {app.remarks}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1 font-semibold text-slate-800 font-mono">
                        ₹{app.estimatedBudget.toLocaleString("en-IN")}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {app.plantLocation}
                      </div>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(app._id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition inline-flex items-center gap-1 border border-slate-300"
                        title="View Side-by-Side OCR Comparison"
                      >
                        <FileSearch className="w-3.5 h-3.5 text-gov-navy" /> OCR Audit
                      </button>

                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setDecisionType("APPROVED");
                          setRemarks("");
                          setActionError(null);
                        }}
                        className="px-3 py-1.5 bg-gov-navy hover:bg-slate-800 text-white font-semibold rounded text-xs transition shadow"
                      >
                        Commit Decision
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <span className="font-bold text-slate-900">{pagination.page}</span> of{" "}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side OCR Comparison Detail Modal */}
      {detailAppId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-gov-navy px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-gov-gold" /> Side-by-Side OCR & Form Data Comparison Audit
              </h3>
              <button
                onClick={() => {
                  setDetailAppId(null);
                  setDetailData(null);
                }}
                className="text-slate-300 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gov-navy border-t-transparent mb-2" />
                  <p>Running field-level OCR cross-match engine...</p>
                </div>
              ) : detailData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{detailData.application?.companyName}</p>
                      <p className="text-slate-500 font-mono text-[11px]">App ID: {detailData.application?.applicationNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-900 font-mono text-xs font-bold rounded">
                      OCR Confidence: {detailData.overallOcrConfidence}%
                    </span>
                  </div>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                          <th className="p-3">Field Name</th>
                          <th className="p-3">Submitted Profile Form Data</th>
                          <th className="p-3">Extracted Document OCR Data</th>
                          <th className="p-3 text-right">Similarity / Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {detailData.comparisons.map((comp, idx) => (
                          <tr
                            key={idx}
                            className={
                              comp.isNearThresholdMismatch
                                ? "bg-amber-50/80 font-medium"
                                : comp.isMatch
                                ? "bg-emerald-50/30"
                                : "bg-white"
                            }
                          >
                            <td className="p-3 font-semibold text-slate-800">{comp.fieldName}</td>
                            <td className="p-3 font-mono text-slate-900">{comp.submittedValue}</td>
                            <td className="p-3 font-mono text-slate-900">{comp.ocrExtractedValue}</td>
                            <td className="p-3 text-right">
                              {comp.isNearThresholdMismatch ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono border border-amber-300">
                                  <Sparkles className="w-3 h-3 text-amber-600" /> Near-Threshold ({comp.similarityScore}%)
                                </span>
                              ) : comp.isMatch ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Exact Match (100%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">
                                  <XCircle className="w-3 h-3 text-red-600" /> Mismatch ({comp.similarityScore}%)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Failed to load OCR detail audit.</p>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setDetailAppId(null);
                  setDetailData(null);
                }}
                className="px-4 py-2 bg-gov-navy text-white font-semibold text-xs rounded-lg hover:bg-slate-800"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Action Modal (Approve / Reject) */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gov-navy px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gov-gold" /> Statutory Decision: {selectedApp.applicationNumber}
              </h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-300 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitDecision} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> {actionError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedApp.companyName}</p>
                <p className="text-slate-600">Applicant: {selectedApp.applicantName}</p>
                <p className="text-slate-600">Clearance: {selectedApp.title}</p>
              </div>

              {/* Decision Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Statutory Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionType("APPROVED")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition ${
                      decisionType === "APPROVED"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Grant Approval
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("REJECTED")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition ${
                      decisionType === "REJECTED"
                        ? "bg-red-600 text-white border-red-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Refuse Clearance
                  </button>
                </div>
              </div>

              {/* Rejection Reason Dropdown (Required on REJECT) */}
              {decisionType === "REJECTED" && (
                <div>
                  <label className="block text-xs font-semibold text-red-900 mb-1">
                    Select Standard Statutory Rejection Reason *
                  </label>
                  <select
                    value={reasonPreset}
                    onChange={(e) => {
                      setReasonPreset(e.target.value);
                      if (e.target.value !== COMMON_REJECTION_REASONS[COMMON_REJECTION_REASONS.length - 1]) {
                        setRemarks(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg outline-none bg-red-50/30 text-slate-900 font-medium"
                  >
                    {COMMON_REJECTION_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Detailed Remarks Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Audit Remarks {decisionType === "REJECTED" ? "*" : "(Optional)"}
                </label>
                <textarea
                  rows={3}
                  required={decisionType === "REJECTED"}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    decisionType === "REJECTED"
                      ? "Specify detailed statutory reason for refusing clearance..."
                      : "Enter official license grant notes or conditions..."
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gov-navy"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow transition flex items-center gap-1.5 ${
                    decisionType === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {actionLoading ? "Committing..." : "Commit Statutory Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
