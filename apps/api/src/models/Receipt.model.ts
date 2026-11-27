import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    invoiceId: { type: Schema.Types.ObjectId, required: true },
    farmerId: { type: Schema.Types.ObjectId, required: true },
    amountPaise: { type: Number, required: true },
    method: {
      type: String,
      enum: ["CASH", "UPI", "BANK", "OTHER"],
      required: true,
    },
    paymentDate: { type: String, required: true },
    note: String,
    reference: String,
    status: { type: String, enum: ["POSTED", "REVERSED"], required: true },
    idempotencyKey: { type: String, required: true },
    requestFingerprint: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    reversalReason: String,
    reversedAt: Date,
    reversedBy: Schema.Types.ObjectId,
  },
  { timestamps: true },
);
schema.index({ businessId: 1, idempotencyKey: 1 }, { unique: true });
schema.index({ businessId: 1, invoiceId: 1, createdAt: -1 });
export const ReceiptModel = model("Receipt", schema);
