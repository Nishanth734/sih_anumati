import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICitation {
  chunkId: string;
  title: string;
  sourceRule: string;
}

export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ICitation[];
  createdAt: Date;
}

export interface IChatHistory extends Document {
  userId: string;
  sector: string;
  messages: IChatMessage[];
  updatedAt: Date;
}

const CitationSchema = new Schema(
  {
    chunkId: { type: String, required: true },
    title: { type: String, required: true },
    sourceRule: { type: String, required: true },
  },
  { _id: false }
);

const ChatMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: [CitationSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatHistorySchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sector: {
      type: String,
      default: "Boiler",
    },
    messages: [ChatMessageSchema],
  },
  {
    timestamps: true,
  }
);

const ChatHistory: Model<IChatHistory> =
  mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);

export default ChatHistory;
