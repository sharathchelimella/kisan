import type { Farmer } from "@kisan/contracts";

export const demoFarmers = [
  {
    id: "DEMO-farmer-1",
    name: "DEMO Ravi Kumar",
    village: "Madhapur",
    mobile: "9876543210",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEMO-farmer-2",
    name: "DEMO Lakshmi Devi",
    village: "Narsapur",
    mobile: "9876543211",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
] satisfies Farmer[];
