import { Schema, model } from "mongoose";

const invoiceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    jobId: { type: Schema.Types.ObjectId, required: true },
    farmerId: { type: Schema.Types.ObjectId, required: true },
    invoiceNumber: { type: String, required: true },
    sequence: { type: Number, required: true },
    lifecycle: { type: String, enum: ["ISSUED", "VOID"], required: true },
    issuedAt: { type: Date, required: true },
    workDate: { type: String, required: true },
    farmerSnapshot: { name: String, mobile: String, village: String },
    ownerSnapshot: { name: String, phone: String, address: String },
    lines: [
      {
        _id: false,
        lineId: String,
        serviceId: Schema.Types.ObjectId,
        equipmentIds: [Schema.Types.ObjectId],
        serviceName: String,
        unit: String,
        quantity: String,
        ratePaise: Number,
        amountPaise: Number,
      },
    ],
    totalPaise: { type: Number, required: true },
    paidPaise: { type: Number, default: 0, required: true },
    duePaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID", "VOID"],
      required: true,
    },
    version: { type: Number, default: 1, required: true },
    voidReason: String,
  },
  { timestamps: true },
);
invoiceSchema.index({ businessId: 1, jobId: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, sequence: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
export const InvoiceModel = model("Invoice", invoiceSchema);
