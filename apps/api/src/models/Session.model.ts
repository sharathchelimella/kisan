import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    digest: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    businessId: { type: Schema.Types.ObjectId, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export const AuthSession = model("AuthSession", sessionSchema);
