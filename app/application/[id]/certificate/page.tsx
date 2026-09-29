"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  Award,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Download,
} from "lucide-react";

interface CertificateData {
  certificateNumber: string;
  applicationNumber: string;
  applicantName: string;
  companyName: string;
  sector: string;
  category: string;
  plantLocation: string;
  estimatedBudget: number;
  status: "APPROVED" | "DEEMED_APPROVED";
  isDeemedApproved: boolean;
  approvalDate: string;
  expiryDate: string;
  authorityName: string;
  legalCitation: string;
  digitalSignatureHash: string;
  verifiedDocuments: Array<{ documentType: string; fileName: string; verifiedAt: string }>;
  statutoryConditions: string[];
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;

    fetch(`/api/applications/${applicationId}/certificate`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCert(data.data);
        } else {
          setError(data.error || "Failed to load statutory certificate.");
        }
      })
      .catch(() => setError("Network error loading certificate."))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-600">
        <RefreshCw className="w-8 h-8 text-gov-gold animate-spin" />
        <p className="text-sm font-medium">Loading Verifiable Clearance Certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="py-20 flex flex-col items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 rounded-xl border border-red-200 shadow-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Certificate Unavailable</h2>
          <p className="text-xs text-slate-600">{error || "This clearance application is not yet approved."}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard/entrepreneur"
              className="px-4 py-2 bg-gov-navy text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDeemed = cert.isDeemedApproved || cert.status === "DEEMED_APPROVED";

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans print:p-0 print:bg-white">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="max-w-4xl mx-auto flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/entrepreneur"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Official Certificate Container */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border-4 border-amber-600/30 p-8 sm:p-14 relative overflow-hidden print:shadow-none print:border-2 print:border-slate-800 print:p-6">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <Award className="w-[500px] h-[500px] text-gov-navy" />
        </div>

        {/* Certificate Header with National Emblem styling */}
        <div className="text-center space-y-3 border-b-2 border-amber-500/40 pb-6 relative z-10">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="p-3 bg-slate-900 text-amber-400 rounded-full shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <div className="text-xs uppercase tracking-widest font-extrabold text-slate-600">
            Government of India & State Licensing Authorities
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gov-navy tracking-tight">
            {isDeemed ? "STATUTORY DEEMED APPROVAL CERTIFICATE" : "CERTIFICATE OF REGULATORY CLEARANCE"}
          </h1>
          <p className="text-xs text-amber-700 font-semibold tracking-wide">
            ANUMATI SINGLE-WINDOW INDUSTRIAL APPROVAL SYSTEM
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-mono font-bold text-amber-900">
            Certificate ID: {cert.certificateNumber}
          </div>
        </div>

        {/* Legal Authority Citation Banner */}
        <div className="my-6 p-4 bg-slate-50 border-l-4 border-amber-500 rounded-r-lg text-xs leading-relaxed space-y-1 relative z-10">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Issuing Authority</div>
          <div className="font-semibold text-slate-900">{cert.authorityName}</div>
          <div className="text-slate-600 text-[11px] pt-1">{cert.legalCitation}</div>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-800 relative z-10">
          <p className="text-justify indent-8">
            This is to formally certify that the enterprise{" "}
            <span className="font-bold text-slate-950 underline decoration-amber-500 decoration-2">
              {cert.companyName}
            </span>{" "}
            (Applicant: <span className="font-semibold">{cert.applicantName}</span>) has satisfactorily fulfilled all
            prescribed statutory filing obligations, spatial layout verifications, and compliance criteria under the{" "}
            <span className="font-bold">{cert.sector} Sector Regulation</span> for their industrial unit situated at:
          </p>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 font-medium text-xs text-slate-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Building2 className="w-4 h-4 text-amber-700" /> Plant Coordinates & Location:
            </div>
            <div className="pl-6 text-slate-800">{cert.plantLocation}</div>
          </div>

          {/* Grid of Key Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-y border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Application No:</span>
              <span className="font-mono font-bold text-slate-900">{cert.applicationNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Industry Category:</span>
              <span className="font-semibold text-slate-900">{cert.category} Category</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Approval Date:</span>
              <span className="font-semibold text-slate-900">
                {new Date(cert.approvalDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Valid Until:</span>
              <span className="font-semibold text-slate-900">
                {new Date(cert.expiryDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Statutory Conditions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Statutory Conditions of Grant</h3>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
              {cert.statutoryConditions.map((cond, idx) => (
                <li key={idx}>{cond}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Signatures and Verification Hash */}
        <div className="mt-10 pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          {/* QR Code and Cryptographic Hash */}
          <div className="flex items-center gap-4">
            <div className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 flex flex-col items-center">
              <QrCode className="w-16 h-16 text-slate-900" />
              <span className="text-[9px] font-mono text-slate-500 mt-0.5">SCAN TO VERIFY</span>
            </div>
            <div className="space-y-1 max-w-xs">
              <div className="text-[10px] font-bold uppercase text-slate-500">Cryptographic Audit Hash (SHA-256)</div>
              <div className="text-[9px] font-mono font-semibold text-slate-800 break-all leading-tight bg-slate-100 p-1.5 rounded border border-slate-200">
                {cert.digitalSignatureHash}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tamper-Evident Digital Seal
              </div>
            </div>
          </div>

          {/* Digital Signatory Stamp */}
          <div className="text-center sm:text-right space-y-1">
            <div className="inline-block p-2 rounded border border-dashed border-amber-600/40 bg-amber-50/50 mb-1">
              <div className="text-[10px] font-extrabold text-amber-900 tracking-wider">DIGITALLY SIGNED & SEALED</div>
              <div className="text-[9px] text-slate-600">{new Date(cert.approvalDate).toUTCString()}</div>
            </div>
            <div className="font-bold text-xs text-slate-900">
              {isDeemed ? "Registrar, MRTPS Commission" : "Authorized Clearance Officer"}
            </div>
            <div className="text-[11px] text-slate-500">{cert.authorityName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
