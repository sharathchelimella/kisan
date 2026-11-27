import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    unit: {
      type: String,
      enum: ["HOUR", "ACRE", "TRIP", "FIXED"] as const,
      required: true,
    },
    defaultRatePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    equipmentIds: [{ type: Schema.Types.ObjectId, required: true }],
    active: { type: Boolean, required: true },
    rateHistory: {
      type: [
        new Schema(
          {
            unit: String,
            defaultRatePaise: Number,
            changedAt: Date,
            actorId: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);
schema.index({ businessId: 1, active: 1, name: 1 });
export const ServiceModel = model("Service", schema);
