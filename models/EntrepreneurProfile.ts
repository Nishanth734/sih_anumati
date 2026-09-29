import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntrepreneurProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  pan: string;
  gstin: string;
  registeredAddress: string;
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const EntrepreneurProfileSchema: Schema<IEntrepreneurProfile> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company / Business name is required"],
      trim: true,
    },
    pan: {
      type: String,
      required: [true, "PAN is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    gstin: {
      type: String,
      required: [true, "GSTIN or Udyam number is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    registeredAddress: {
      type: String,
      required: [true, "Registered business address is required"],
      trim: true,
    },
    sector: {
      type: String,
      enum: ["Boiler", "Pollution", "FactoryLicense"],
      required: [true, "Industry sector is required"],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Official email is required"],
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EntrepreneurProfile: Model<IEntrepreneurProfile> =
  mongoose.models.EntrepreneurProfile ||
  mongoose.model<IEntrepreneurProfile>("EntrepreneurProfile", EntrepreneurProfileSchema);

export default EntrepreneurProfile;
