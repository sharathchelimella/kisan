import { Schema, model } from "mongoose";

const businessSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerUserId: { type: Schema.Types.ObjectId, required: true, unique: true },
    village: { type: String, required: true },
    phone: String,
    address: String,
    timezone: { type: String, default: "Asia/Kolkata", required: true },
    invoicePrefix: { type: String, default: "KMM", required: true },
    nextInvoiceSequence: { type: Number, default: 1, required: true },
    notificationsOptIn: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

export const Business = model("Business", businessSchema);
