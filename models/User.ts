import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "entrepreneur" | "officer";
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  pan?: string;
  companyName?: string;
  businessAddress?: string;
  employeeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: {
        values: ["entrepreneur", "officer"],
        message: "Role must be either entrepreneur or officer",
      },
      required: [true, "Role is required"],
      index: true,
    },
    sector: {
      type: String,
      enum: {
        values: ["Boiler", "Pollution", "FactoryLicense"],
        message: "Sector must be Boiler, Pollution, or FactoryLicense",
      },
      required: [true, "Sector is required"],
      index: true,
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    businessAddress: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js development HMR environment
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
