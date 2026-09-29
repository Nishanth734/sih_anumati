import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoadmapStep {
  stepNumber: number;
  stepCode: string;
  title: string;
  description: string;
  department: string;
  requiredDocuments: string[];
  estimatedProcessingTime: string;
}

export interface ISectorRoadmap extends Document {
  _id: mongoose.Types.ObjectId;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  title: string;
  description: string;
  orderedSteps: IRoadmapStep[];
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapStepSchema = new Schema<IRoadmapStep>(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    stepCode: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Step title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Step description is required"],
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    estimatedProcessingTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const SectorRoadmapSchema: Schema<ISectorRoadmap> = new Schema(
  {
    sector: {
      type: String,
      enum: {
        values: ["Boiler", "Pollution", "FactoryLicense"],
        message: "Sector must be Boiler, Pollution, or FactoryLicense",
      },
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    orderedSteps: {
      type: [RoadmapStepSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const SectorRoadmap: Model<ISectorRoadmap> =
  mongoose.models.SectorRoadmap || mongoose.model<ISectorRoadmap>("SectorRoadmap", SectorRoadmapSchema);

export default SectorRoadmap;
