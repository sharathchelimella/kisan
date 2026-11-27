import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    invoiceId: { type: Schema.Types.ObjectId, required: true },
    receiptId: { type: Schema.Types.ObjectId, required: true },
    amountPaise: { type: Number, required: true },
    reversedAt: Date,
  },
  { timestamps: true },
);
schema.index({ businessId: 1, receiptId: 1 }, { unique: true });
schema.index({ businessId: 1, invoiceId: 1 });
export const AllocationModel = model("Allocation", schema);
