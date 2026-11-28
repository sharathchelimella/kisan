import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    kind: { type: String, required: true },
    displayIcon: String,
    serialOrRegistration: String,
    serialNumber: String,
    active: { type: Boolean, required: true },
    brand: String,
    model: String,
    purchaseDate: String,
    purchaseCostPaise: Number,
    status: {
      type: String,
      enum: ["ACTIVE", "AVAILABLE", "MAINTENANCE", "INACTIVE"],
    },
    notes: String,
    lastServiceDate: String,
    nextMaintenanceDate: String,
    horsepower: Number,
    driveType: String,
    implementSize: String,
    capacity: String,
    photoDataUrl: String,
    availabilityRecords: [
      {
        _id: false,
        from: { type: String, required: true },
        to: { type: String, required: true },
        hours: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);
schema.index({ businessId: 1, active: 1, name: 1 });
export const EquipmentModel = model("Equipment", schema);
