import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    kind: { type: String, required: true },
    displayIcon: String,
    serialOrRegistration: String,
    active: { type: Boolean, required: true },
  },
  { timestamps: true },
);
schema.index({ businessId: 1, active: 1, name: 1 });
export const EquipmentModel = model("Equipment", schema);
