import { Schema, model } from "mongoose";

const lineSchema = new Schema(
  {
    lineId: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, required: true },
    serviceNameSnapshot: { type: String, required: true },
    equipmentIds: [{ type: Schema.Types.ObjectId, required: true }],
    unit: { type: String, required: true },
    quantity: { type: String, required: true },
    operatingHours: String,
    pricingMode: { type: String, required: true },
    defaultRateSnapshotPaise: { type: Number, required: true },
    agreedRatePaise: Number,
    totalPaise: { type: Number, required: true },
    reason: String,
  },
  { _id: false },
);

const jobSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    farmerId: { type: Schema.Types.ObjectId, required: true },
    workDate: { type: String, required: true },
    village: { type: String, required: true },
    fieldLocation: String,
    notes: String,
    state: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "BILLED", "CANCELLED"],
      required: true,
    },
    lines: { type: [lineSchema], required: true },
    totalPaise: { type: Number, required: true },
    invoiceId: { type: Schema.Types.ObjectId, default: null },
    completedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, required: true },

    revisions: [
      {
        _id: false,
        action: { type: String, required: true },
        reason: { type: String, required: true },
        actorId: { type: Schema.Types.ObjectId, required: true },
        at: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);
jobSchema.index({ businessId: 1, workDate: -1 });
jobSchema.index({ businessId: 1, farmerId: 1, workDate: -1 });
jobSchema.index({ businessId: 1, "lines.serviceId": 1, workDate: -1 });
export const JobModel = model("Job", jobSchema);
