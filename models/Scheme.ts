import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScheme extends Document {
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  schemeId: string;
  name: string;
  ministry: string;
  eligibilitySummary: string;
  benefits: string;
  benefitAmount: string;
  applicationDescription: string;
  officialLink: string;
  isActive: boolean;
  createdAt: Date;
}

const SchemeSchema: Schema = new Schema(
  {
    sector: {
      type: String,
      enum: ["Boiler", "Pollution", "FactoryLicense"],
      required: true,
      index: true,
    },
    schemeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    ministry: {
      type: String,
      required: true,
    },
    eligibilitySummary: {
      type: String,
      required: true,
    },
    benefits: {
      type: String,
      required: true,
    },
    benefitAmount: {
      type: String,
      required: true,
    },
    applicationDescription: {
      type: String,
      required: true,
    },
    officialLink: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Scheme: Model<IScheme> =
  mongoose.models.Scheme || mongoose.model<IScheme>("Scheme", SchemeSchema);

export default Scheme;
