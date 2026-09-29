"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Loader2,
  Info,
} from "lucide-react";

interface Props {
  applicationId: string;
  applicationStatus: string;
  verificationFailures?: string[];
  onUploadSuccess?: () => void;
}

export default function DocumentUploadPipeline({
  applicationId,
  applicationStatus: initialStatus,
  verificationFailures: initialFailures = [],
  onUploadSuccess,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<
    "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC" | "OTHER"
  >("PAN_CARD");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [uploadError, setUploadError] = useState<{
    message: string;
    type: "VALIDATION_ERROR" | "SANITY_ERROR" | "NETWORK_ERROR";
  } | null>(null);

  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [failures, setFailures] = useState<string[]>(initialFailures);
  const [lastVerification, setLastVerification] = useState<any | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side Pre-Validation
    if (file.size > 10 * 1024 * 1024) {
      setUploadError({
        message: `File size limit exceeded: Selected file is ${(file.size / (1024 * 1024)).toFixed(
          2
        )}MB. Maximum allowed threshold is 10MB.`,
        type: "VALIDATION_ERROR",
      });
      setSelectedFile(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext || "")) {
      setUploadError({
        message: `Invalid file format '.${ext}'. Please select a statutory PDF, JPG, or PNG document.`,
        type: "VALIDATION_ERROR",
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndVerify = async () => {
    if (!selectedFile || !applicationId) return;

    setUploading(true);
    setProgress(15);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("applicationId", applicationId);
      formData.append("documentType", documentType);

      setProgress(45);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(85);

      const result = await response.json();

      if (!result.success) {
        if (result.errorType === "SANITY_ERROR") {
          setUploadError({
            message: result.error || "Malformed file header signature detected.",
            type: "SANITY_ERROR",
          });
        } else {
          setUploadError({
            message: result.error || "Document validation failed.",
            type: "VALIDATION_ERROR",
          });
        }
        setUploading(false);
        return;
      }

      setProgress(100);
      setLastVerification(result.data.verification);
      setCurrentStatus(result.data.applicationStatus);

      if (!result.data.verification.passed) {
        setFailures(result.data.verification.failures);
      } else {
        setFailures([]);
      }

      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setUploadError({
        message: "Network connection lost or server unreachable during upload.",
        type: "NETWORK_ERROR",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gov-navy flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-gov-gold" />
            Statutory Document Verification Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated server-side OCR extraction, magic-bytes sanity guard, and hard-gate compliance checks.
          </p>
        </div>

        {/* Hard Gate Status Badge */}
        <div>
          {currentStatus === "RETURNED_TO_APPLICANT" && (
            <span className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-300 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-600" /> RETURNED TO APPLICANT
            </span>
          )}
          {currentStatus === "READY_FOR_REVIEW" && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> READY FOR REVIEW
            </span>
          )}
          {currentStatus === "PENDING" && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 font-mono text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" /> UPLOAD REQUIRED
            </span>
          )}
        </div>
      </div>

      {/* Verification Failures Rejection Box (If RETURNED_TO_APPLICANT) */}
      {currentStatus === "RETURNED_TO_APPLICANT" && failures.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-red-900 text-xs uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Hard-Gate Verification Rejection Reasons
            </div>
            <span className="text-[11px] font-mono bg-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
              BLOCKED FROM OFFICER QUEUE
            </span>
          </div>

          <p className="text-xs text-red-800 font-medium">
            This application has been automatically returned to you. Correct the statutory documents below to resubmit:
          </p>

          <ul className="space-y-2">
            {failures.map((reason, idx) => (
              <li key={idx} className="text-xs text-red-900 flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-red-200 font-mono">
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document Selection & Dropzone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Document Category *</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-gov-navy bg-white font-medium"
          >
            <option value="PAN_CARD">Business Tax PAN Card</option>
            <option value="GSTIN_CERTIFICATE">GSTIN Registration Certificate</option>
            <option value="SITE_PLAN">Factory Site & Layout Plan</option>
            <option value="SAFETY_NOC">Fire Safety & Equipment NOC</option>
            <option value="OTHER">Other Compliance Document</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Choose File (PDF, PNG, JPG &bull; Max 10MB) *
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gov-navy file:text-white hover:file:bg-slate-800 cursor-pointer border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Upload Error Display (Validation vs Sanity vs Network) */}
      {uploadError && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
            uploadError.type === "SANITY_ERROR"
              ? "bg-purple-50 text-purple-900 border-purple-300"
              : uploadError.type === "VALIDATION_ERROR"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-amber-50 text-amber-900 border-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block font-mono">
                {uploadError.type === "SANITY_ERROR"
                  ? "VIRUS / MALFORMED FILE GUARD"
                  : uploadError.type === "VALIDATION_ERROR"
                  ? "DOCUMENT VALIDATION ERROR"
                  : "NETWORK CONNECTION ERROR"}
              </span>
              <span>{uploadError.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-navy" />
              Running Server-Side OCR & Verification Engine...
            </span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gov-navy h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Verification Results Panel (After Upload) */}
      {lastVerification && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-gov-gold" /> OCR Confidence & Extraction Summary
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                lastVerification.ocrConfidence >= 70
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              OCR Confidence: {lastVerification.ocrConfidence}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <span className="font-semibold text-slate-500 block text-[10px]">EXTRACTED PAN</span>
              <span className="font-mono text-slate-900 font-bold">
                {lastVerification.extractedFields?.pan || "N/A"}
              </span>
            </div>

            <div className="p-2.5 bg-white rounded border border-slate-200">
              <span className="font-semibold text-slate-500 block text-[10px]">EXTRACTED GSTIN</span>
              <span className="font-mono text-slate-900 font-bold">
                {lastVerification.extractedFields?.gstin || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!selectedFile || uploading}
          onClick={handleUploadAndVerify}
          className="px-5 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying Document...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-gov-gold" /> Upload & Verify Statutory Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
