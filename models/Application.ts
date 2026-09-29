import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  applicationNumber: string;
  applicantId: mongoose.Types.ObjectId;
  applicantName: string;
  companyName: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  title: string;
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
  assignedOfficerId?: mongoose.Types.ObjectId;
  remarks?: string;
  submissionMethod?: "PDF_TEXT_EXTRACTION" | "OCR" | "MANUAL";
  verificationFailures?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema<IApplication> = new Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    sector: {
      type: String,
      enum: ["Boiler", "Pollution", "FactoryLicense"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Application title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Application description is required"],
    },
    estimatedBudget: {
      type: Number,
      required: [true, "Estimated budget is required"],
    },
    plantLocation: {
      type: String,
      required: [true, "Plant location address is required"],
    },
    submissionMethod: {
      type: String,
      enum: ["PDF_TEXT_EXTRACTION", "OCR", "MANUAL"],
      default: "MANUAL",
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "RETURNED_TO_APPLICANT",
        "READY_FOR_REVIEW",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "ADDITIONAL_INFO_REQUIRED",
      ],
      default: "PENDING",
      index: true,
    },
    assignedOfficerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    verificationFailures: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>("Application", ApplicationSchema);

export default Application;
