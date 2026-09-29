import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  documentType: "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC" | "OTHER";
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileBufferBase64?: string;
  ocrText?: string;
  ocrConfidence?: number; // Overall OCR confidence 0 - 100
  extractedFields: {
    pan?: string;
    gstin?: string;
    name?: string;
    address?: string;
    issueDate?: Date;
    expiryDate?: Date;
    lowConfidenceFields?: string[]; // Fields with OCR confidence < 70%
  };
  ragVerification?: {
    compliant: boolean;
    missingElements: string[];
    reasoning: string;
    retrievedRules: Array<{ chunkId: string; title: string; sourceRule: string }>;
  };
  verificationStatus: "PENDING" | "PASSED" | "FAILED";
  verificationFailures: string[];
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema<IDocument> = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["PAN_CARD", "GSTIN_CERTIFICATE", "SITE_PLAN", "SAFETY_NOC", "OTHER"],
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileBufferBase64: {
      type: String,
    },
    ocrText: {
      type: String,
      default: "",
    },
    ocrConfidence: {
      type: Number,
      default: 0,
    },
    extractedFields: {
      pan: { type: String, trim: true },
      gstin: { type: String, trim: true },
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      lowConfidenceFields: { type: [String], default: [] },
    },
    ragVerification: {
      compliant: { type: Boolean, default: false },
      missingElements: { type: [String], default: [] },
      reasoning: { type: String, default: "" },
      retrievedRules: [
        {
          chunkId: String,
          title: String,
          sourceRule: String,
        },
      ],
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "PASSED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    verificationFailures: {
      type: [String],
      default: [],
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
