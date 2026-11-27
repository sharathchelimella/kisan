import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    village: { type: String, required: true },
    normalizedVillage: { type: String, required: true },
    mobile: String,
    normalizedMobile: String,
    notes: String,
    archivedAt: Date,
  },
  { timestamps: true },
);
schema.index({ businessId: 1, normalizedName: 1 });
schema.index({ businessId: 1, mobile: 1 });
schema.index({ businessId: 1, village: 1, normalizedName: 1 });
export const FarmerModel = model("Farmer", schema);
