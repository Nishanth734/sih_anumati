"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Eye,
  X,
  Lock,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Building2,
  Check,
} from "lucide-react";

interface ExtractedFields {
  pan?: string;
  gstin?: string;
  name?: string;
  address?: string;
  issueDate?: string;
  expiryDate?: string;
  lowConfidenceFields?: string[];
}

interface RagVerification {
  compliant: boolean;
  missingElements: string[];
  reasoning: string;
  retrievedRules?: Array<{ chunkId: string; title: string; sourceRule: string }>;
}

interface DocumentRecord {
  _id: string;
  documentType: "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC" | "OTHER";
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrConfidence?: number;
  ocrText?: string;
  extractedFields?: ExtractedFields;
  ragVerification?: RagVerification;
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  verificationFailures: string[];
  verifiedAt?: string;
}

interface ApplicationData {
  _id: string;
  applicationNumber: string;
  companyName: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  title: string;
  description: string;
  status: "PENDING" | "READY_FOR_REVIEW" | "UNDER_REVIEW" | "RETURNED_TO_APPLICANT" | "APPROVED" | "REJECTED";
  verificationFailures?: string[];
  assignedOfficerId?: string;
  remarks?: string;
}

const REQUIRED_DOC_SLOTS: Record<
  string,
  Array<{
    type: "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC";
    title: string;
    description: string;
    requiredElements: string[];
  }>
> = {
  Boiler: [
    {
      type: "PAN_CARD",
      title: "Business Tax PAN Card",
      description: "Government-issued Permanent Account Number card matching registered company details.",
      requiredElements: ["Valid 10-character PAN Regex", "Company Name Cross-match"],
    },
    {
      type: "GSTIN_CERTIFICATE",
      title: "GSTIN Registration Certificate",
      description: "Goods and Services Tax Identification Certificate issued by CBIC.",
      requiredElements: ["Valid 15-digit GSTIN Checksum", "Active Status", "Address Similarity"],
    },
    {
      type: "SITE_PLAN",
      title: "Boiler Layout & Pressure Vessel Specification",
      description: "Approved factory site layout plan showing boiler clearance distances and pressure specs.",
      requiredElements: ["Working Pressure Rating / MAWP", "Structural Safety Distance Margin", "NDT Inspector Clearance"],
    },
    {
      type: "SAFETY_NOC",
      title: "Safety Relief Valve & Hydrostatic Inspection NOC",
      description: "Hydraulic test certificate and safety valve calibration report by certified boiler inspector.",
      requiredElements: ["Safety Relief Valve Calibration", "Hydrostatic 1.5x Pressure Test Log", "Inspector Signoff"],
    },
  ],
  Pollution: [
    {
      type: "PAN_CARD",
      title: "Business Tax PAN Card",
      description: "Government-issued Permanent Account Number card matching registered company details.",
      requiredElements: ["Valid 10-character PAN Regex", "Company Name Cross-match"],
    },
    {
      type: "GSTIN_CERTIFICATE",
      title: "GSTIN Registration Certificate",
      description: "Goods and Services Tax Identification Certificate issued by CBIC.",
      requiredElements: ["Valid 15-digit GSTIN Checksum", "Active Status", "Address Similarity"],
    },
    {
      type: "SITE_PLAN",
      title: "Effluent Treatment Plant (ETP) Layout Plan",
      description: "Comprehensive engineering diagram for ETP, zero liquid discharge, and wastewater treatment.",
      requiredElements: ["Effluent Treatment Capacity", "ZLD Discharge Specifications", "Flow Rate Parameters"],
    },
    {
      type: "SAFETY_NOC",
      title: "Ambient Air & Stack Emission Clearance NOC",
      description: "Air pollution control equipment design and chimney stack height compliance certificate.",
      requiredElements: ["Chimney Stack Emission Limits", "Wet Scrubber / Bag Filter Specs", "Air Quality Test Signoff"],
    },
  ],
  FactoryLicense: [
    {
      type: "PAN_CARD",
      title: "Business Tax PAN Card",
      description: "Government-issued Permanent Account Number card matching registered company details.",
      requiredElements: ["Valid 10-character PAN Regex", "Company Name Cross-match"],
    },
    {
      type: "GSTIN_CERTIFICATE",
      title: "GSTIN Registration Certificate",
      description: "Goods and Services Tax Identification Certificate issued by CBIC.",
      requiredElements: ["Valid 15-digit GSTIN Checksum", "Active Status", "Address Similarity"],
    },
    {
      type: "SITE_PLAN",
      title: "Architectural Building Layout Plan",
      description: "DISH approved factory building layout showing emergency egress routes and machine fencing.",
      requiredElements: ["Fire Tender Setback Margin", "Structural Stability Seal", "Emergency Egress Width"],
    },
    {
      type: "SAFETY_NOC",
      title: "Fire Safety & Worker Safety NOC",
      description: "Fire Department clearance NOC and heavy electrical machinery grounding audit certificate.",
      requiredElements: ["Fire Hydrant System Test", "Electrical Grounding Certificate", "Certified Safety Officer Signoff"],
    },
  ],
};

export default function DocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFailureDoc, setSelectedFailureDoc] = useState<DocumentRecord | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [dragActiveDocType, setDragActiveDocType] = useState<string | null>(null);

  const fetchApplicationDetails = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setUploadError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // 1. Session verification check
      const meRes = await fetch("/api/auth/me", { signal: controller.signal });
      const meData = await meRes.json();

      if (!meRes.ok || !meData.success || !meData.data?.user) {
        router.push(`/login?callbackUrl=/application/${applicationId}/upload`);
        return;
      }

      if (meData.data.user.role !== "entrepreneur") {
        router.push("/dashboard/officer");
        return;
      }

      // 2. Application details fetch
      const res = await fetch(`/api/applications/${applicationId}/details`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const json = await res.json();

      if (json.success && json.data) {
        setApplication(json.data.application);
        setDocuments(json.data.documents || []);
        setProfile(json.data.profile || null);
      } else {
        setUploadError(json.error || "Failed to load application details.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setUploadError("Application data load request timed out.");
      } else {
        setUploadError("Error connecting to server. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [applicationId, router]);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setUploadError("Session loading timed out.");
      }
    }, 5000);

    if (applicationId) {
      fetchApplicationDetails();
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [applicationId, fetchApplicationDetails]);

  const handleFileUpload = async (docType: string, file: File) => {
    setUploadError(null);

    // Client-side validation
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      setUploadError(`File "${file.name}" exceeds the 10MB limit. Please select a smaller file.`);
      return;
    }

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError(`Invalid file format "${fileExt}". Please upload PDF, JPG, or PNG files only.`);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s overall upload/verification timeout

    try {
      setUploadingDocType(docType);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicationId);
      formData.append("documentType", docType);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await res.json();

      if (!json.success) {
        setUploadError(json.error || "Document upload or verification failed.");
      } else {
        // Refresh documents and application status
        await fetchApplicationDetails();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setUploadError("Document verification request timed out after 30 seconds. Please click 'Re-upload File' to try again.");
      } else {
        setUploadError("Failed to upload document due to network error.");
      }
    } finally {
      clearTimeout(timeoutId);
      setUploadingDocType(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, docType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveDocType(docType);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveDocType(null);
  };

  const handleDrop = (e: React.DragEvent, docType: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveDocType(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(docType, e.dataTransfer.files[0]);
    }
  };

  const docSlots = REQUIRED_DOC_SLOTS[application?.sector || "Boiler"] || REQUIRED_DOC_SLOTS["Boiler"];

  // Helper to find document record for a slot
  const getDocForSlot = (slotType: string) => {
    return documents.find((d) => d.documentType === slotType);
  };

  const totalRequiredCount = docSlots.length;
  const passedDocsCount = docSlots.filter((slot) => {
    const doc = getDocForSlot(slot.type);
    return doc && doc.verificationStatus === "PASSED";
  }).length;

  const allRequiredPassed = totalRequiredCount > 0 && passedDocsCount === totalRequiredCount;
  const hasAnyFailure = documents.some((d) => d.verificationStatus === "FAILED");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-slate-400 font-medium">Loading Document Verification Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/entrepreneur"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {application?.sector} Sector
                </span>
                <span className="text-xs text-slate-400 font-mono">#{application?.applicationNumber}</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">{application?.companyName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400">Verification Status</span>
              <div className="flex items-center gap-1.5 font-medium text-sm">
                {hasAnyFailure ? (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Action Required — Fix Failed Verification
                  </span>
                ) : passedDocsCount < totalRequiredCount ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" /> Incomplete — {passedDocsCount} of {totalRequiredCount} Statutory Documents Verified
                  </span>
                ) : application?.status === "APPROVED" && allRequiredPassed ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Approved & Statutory Clearance Granted
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> All {totalRequiredCount} Passed — Ready for Officer Review
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Status Alert Banner */}
        {hasAnyFailure && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-5 text-red-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-900/50 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-red-100 text-base">Verification Action Required</h3>
                <p className="text-sm text-red-300 mt-1">
                  One or more documents failed the dual-layer verification check (Hard Rules & RAG Statutory Compliance).
                  Inspect the errors below and re-upload corrected documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {allRequiredPassed && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-5 text-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-900/50 text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-100 text-base">All Statutory Documents Passed!</h3>
                <p className="text-sm text-emerald-300 mt-1">
                  Every required document passed both Hard Rules validation and AI RAG statutory compliance checks. Your
                  application is auto-promoted to <strong>READY_FOR_REVIEW</strong>.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/entrepreneur"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg shadow-md transition flex items-center gap-2 text-sm shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" /> Go to Dashboard
            </Link>
          </div>
        )}

        {/* Global Error Notice */}
        {uploadError && (
          <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Title & Dual-Layer Info Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Required Document Upload & Statutory Verification
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Upload required statutory compliance documents for your <strong>{application?.sector}</strong> clearance. Each
              file undergoes real-time server OCR, regex/checksum field verification, and Pinecone RAG statutory clause analysis.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Sparkles className="w-4 h-4" /> ANUMATI Dual-Layer Verification Engine
            </div>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">Layer 1 (Hard Rules):</strong> Regex format, expiry date, fuzzy similarity matching with profile.
              </li>
              <li>
                <strong className="text-slate-200">Layer 2 (RAG Audit):</strong> Groq LLM evaluates extracted text against Pinecone statutory rule chunks.
              </li>
            </ul>
          </div>
        </div>

        {/* Upload Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docSlots.map((slot, index) => {
            const doc = getDocForSlot(slot.type);
            const isUploading = uploadingDocType === slot.type;
            const isDragOver = dragActiveDocType === slot.type;

            return (
              <div
                key={slot.type}
                className={`bg-slate-900 border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                  isDragOver
                    ? "border-amber-400 bg-amber-500/5 ring-2 ring-amber-400/20"
                    : doc?.verificationStatus === "PASSED"
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : doc?.verificationStatus === "FAILED"
                    ? "border-red-500/40 bg-red-950/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Slot Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                        Slot {index + 1} • {slot.type}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{slot.title}</h3>
                    </div>

                    {/* Status Badge */}
                    {isUploading ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                      </span>
                    ) : doc?.verificationStatus === "PASSED" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                      </span>
                    ) : doc?.verificationStatus === "FAILED" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> FAILED
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Pending Upload
                      </span>
                    )}
                  </div>

                  <p className="text-slate-400 text-xs mb-4 leading-relaxed">{slot.description}</p>

                  {/* Required Rules Tags */}
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {slot.requiredElements.map((req, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 text-[11px] border border-slate-700/60"
                      >
                        ✓ {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Upload Area or Document Summary */}
                <div className="mt-4">
                  {isUploading ? (
                    <div className="border-2 border-dashed border-amber-500/50 bg-amber-500/5 rounded-xl p-6 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-amber-300">Processing OCR & Statutory Analysis</p>
                        <p className="text-xs text-slate-400">Tesseract OCR → Hard Rules Check → Pinecone RAG Audit</p>
                      </div>
                    </div>
                  ) : doc ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-slate-200 truncate">{doc.fileName}</p>
                            <p className="text-[11px] text-slate-400">
                              {(doc.fileSize / 1024).toFixed(1)} KB • OCR Confidence:{" "}
                              <strong className="text-amber-400">{doc.ocrConfidence || 92}%</strong>
                            </p>
                          </div>
                        </div>

                        {doc.verificationStatus === "FAILED" && (
                          <button
                            onClick={() => setSelectedFailureDoc(doc)}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded border border-red-500/30 transition shrink-0 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Failures
                          </button>
                        )}
                      </div>

                      {/* Hard Rules & RAG Breakdown snippet */}
                      <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Hard Rules (Regex / Expiry / Match):</span>
                          <span
                            className={
                              doc.verificationFailures.some((f) => !f.includes("[RAG Rule Check]"))
                                ? "text-red-400 font-semibold"
                                : "text-emerald-400 font-semibold"
                            }
                          >
                            {doc.verificationFailures.some((f) => !f.includes("[RAG Rule Check]")) ? "FAILED" : "PASSED"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>RAG Statutory Compliance (Groq + Pinecone):</span>
                          <span
                            className={
                              doc.ragVerification?.compliant ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"
                            }
                          >
                            {doc.ragVerification?.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center justify-between">
                        <label className="cursor-pointer text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" /> Re-upload File
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(slot.type, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* Empty Dropzone Slot */
                    <div
                      onDragOver={(e) => handleDragOver(e, slot.type)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, slot.type)}
                      className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 bg-slate-950/60 rounded-xl p-6 text-center transition cursor-pointer group"
                    >
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700 transition">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Supports PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(slot.type, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Failure Details Modal */}
      {selectedFailureDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFailureDoc(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-xl bg-red-950/60 text-red-400 border border-red-800/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Verification Failure Analysis</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Document Slot: <strong className="text-amber-400">{selectedFailureDoc.documentType}</strong> • File: {selectedFailureDoc.fileName}
                </p>
              </div>
            </div>

            {/* 1. Hard Rules Validation Section */}
            <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 1. Hard Rules Verification Audit
                </h4>
                <span
                  className={
                    selectedFailureDoc.verificationFailures.some((f) => !f.includes("[RAG Rule Check]"))
                      ? "px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                      : "px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }
                >
                  {selectedFailureDoc.verificationFailures.some((f) => !f.includes("[RAG Rule Check]"))
                    ? "FAILED"
                    : "PASSED"}
                </span>
              </div>

              {selectedFailureDoc.verificationFailures.filter((f) => !f.includes("[RAG Rule Check]")).length > 0 ? (
                <div className="space-y-2">
                  {selectedFailureDoc.verificationFailures
                    .filter((f) => !f.includes("[RAG Rule Check]"))
                    .map((failure, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-200 flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-300">{failure}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 p-2.5 rounded border border-emerald-900/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All regex formatting, expiry date, and profile matching checks passed.
                </p>
              )}
            </div>

            {/* 2. RAG Statutory Compliance Section */}
            {selectedFailureDoc.ragVerification && (
              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> 2. RAG Statutory Compliance Audit (Groq + Pinecone)
                  </h4>
                  <span
                    className={
                      selectedFailureDoc.ragVerification.compliant
                        ? "px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                    }
                  >
                    {selectedFailureDoc.ragVerification.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
                  </span>
                </div>

                {/* Groq LLM Reasoning String */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Compliance Analysis Reasoning:
                  </span>
                  <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    &quot;{selectedFailureDoc.ragVerification.reasoning}&quot;
                  </p>
                </div>

                {/* Missing Statutory Required Elements Array */}
                {selectedFailureDoc.ragVerification.missingElements &&
                  selectedFailureDoc.ragVerification.missingElements.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing Required Statutory Clauses / Specifications ({selectedFailureDoc.ragVerification.missingElements.length}):
                      </span>
                      <div className="space-y-1.5">
                        {selectedFailureDoc.ragVerification.missingElements.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-200 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Retrieved Statutory Context Rules */}
                {selectedFailureDoc.ragVerification.retrievedRules &&
                  selectedFailureDoc.ragVerification.retrievedRules.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Retrieved Statutory Context Rules:
                      </span>
                      <div className="space-y-1">
                        {selectedFailureDoc.ragVerification.retrievedRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-semibold text-amber-400">📜 {rule.sourceRule}</span>
                            <span className="text-slate-400 truncate max-w-xs">{rule.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* 3. Extracted Document Fields vs Expected Profile Data */}
            <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 3. Extracted OCR Data vs Expected Profile Data
              </h4>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="text-[11px] uppercase bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5 font-semibold">Field Name</th>
                      <th className="px-3.5 py-2.5 font-semibold">Extracted from Document (OCR)</th>
                      <th className="px-3.5 py-2.5 font-semibold">Expected from Profile</th>
                      <th className="px-3.5 py-2.5 font-semibold">Match Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {/* PAN Card Field Row */}
                    <tr>
                      <td className="px-3.5 py-2.5 font-medium text-slate-300">Tax PAN Number</td>
                      <td className="px-3.5 py-2.5 font-mono text-amber-300">
                        {selectedFailureDoc.extractedFields?.pan || "Not Extracted"}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-300">
                        {profile?.pan || application?.companyName || "N/A"}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {selectedFailureDoc.extractedFields?.pan && profile?.pan &&
                        selectedFailureDoc.extractedFields.pan.toUpperCase().trim() === profile.pan.toUpperCase().trim() ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Match
                          </span>
                        ) : selectedFailureDoc.extractedFields?.pan ? (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Mismatch / Invalid
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>

                    {/* Company / Entity Name Row */}
                    <tr>
                      <td className="px-3.5 py-2.5 font-medium text-slate-300">Company / Firm Name</td>
                      <td className="px-3.5 py-2.5 text-amber-300">
                        {selectedFailureDoc.extractedFields?.name || "Not Extracted"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300">
                        {profile?.companyName || application?.companyName || "N/A"}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {selectedFailureDoc.extractedFields?.name && (profile?.companyName || application?.companyName) ? (
                          <span className="text-slate-300">Checked via Fuzzy Match</span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>

                    {/* GSTIN Row */}
                    <tr>
                      <td className="px-3.5 py-2.5 font-medium text-slate-300">GSTIN Registration</td>
                      <td className="px-3.5 py-2.5 font-mono text-amber-300">
                        {selectedFailureDoc.extractedFields?.gstin || "Not Extracted"}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-300">
                        {profile?.gstin || "N/A"}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {selectedFailureDoc.extractedFields?.gstin && profile?.gstin &&
                        selectedFailureDoc.extractedFields.gstin.toUpperCase().trim() === profile.gstin.toUpperCase().trim() ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Match
                          </span>
                        ) : selectedFailureDoc.extractedFields?.gstin ? (
                          <span className="text-amber-400 font-semibold">Extracted</span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>

                    {/* Address Row */}
                    <tr>
                      <td className="px-3.5 py-2.5 font-medium text-slate-300">Registered Address</td>
                      <td className="px-3.5 py-2.5 text-amber-300">
                        {selectedFailureDoc.extractedFields?.address || "Not Extracted"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300">
                        {profile?.registeredAddress || "N/A"}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {selectedFailureDoc.extractedFields?.address ? (
                          <span className="text-slate-300">Checked via Fuzzy Match</span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Raw OCR Text Box */}
              {selectedFailureDoc.ocrText && (
                <div className="mt-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Raw OCR Text Extracted by Tesseract.js:
                  </span>
                  <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedFailureDoc.ocrText}
                  </pre>
                </div>
              )}
            </div>

            {/* Re-upload Action within Modal */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedFailureDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Close Breakdown
              </button>

              <label className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md">
                <UploadCloud className="w-4 h-4" /> Re-upload Document Now
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const slotType = selectedFailureDoc.documentType;
                      setSelectedFailureDoc(null);
                      handleFileUpload(slotType, e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
