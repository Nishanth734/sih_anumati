import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISectorKnowledge extends Document {
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  documentType: "PAN_CARD" | "GSTIN_CERTIFICATE" | "SITE_PLAN" | "SAFETY_NOC" | "OTHER";
  chunkId: string;
  title: string;
  category: string;
  content: string;
  sourceRule: string;
  keywords: string[];
  createdAt: Date;
}

const SectorKnowledgeSchema: Schema = new Schema(
  {
    sector: {
      type: String,
      enum: ["Boiler", "Pollution", "FactoryLicense"],
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["PAN_CARD", "GSTIN_CERTIFICATE", "SITE_PLAN", "SAFETY_NOC", "OTHER"],
      required: true,
      default: "OTHER",
      index: true,
    },
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sourceRule: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js hot reload
const SectorKnowledge: Model<ISectorKnowledge> =
  mongoose.models.SectorKnowledge ||
  mongoose.model<ISectorKnowledge>("SectorKnowledge", SectorKnowledgeSchema);

export default SectorKnowledge;
