import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true, index: true },
    displayName: { type: String, required: true },
    mobile: String,
    textSize: {
      type: String,
      enum: ["STANDARD", "LARGE"],
      default: "STANDARD",
      required: true,
    },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["OWNER"] as const,
      default: "OWNER",
      required: true,
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "te", "hi"] as const,
      required: true,
    },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
