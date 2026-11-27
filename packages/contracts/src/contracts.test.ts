import { expect, it } from "vitest";
import {
  farmerInputSchema,
  moneyPaiseSchema,
  pageRequestSchema,
  receiptInputSchema,
  workLineSchema,
} from "./index";

it("validates contract boundaries and rejects writable tenancy", () => {
  expect(pageRequestSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  expect(pageRequestSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  expect(moneyPaiseSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(
    false,
  );
  expect(
    farmerInputSchema.safeParse({
      name: "DEMO Farmer",
      village: "DEMO Village",
    }).success,
  ).toBe(true);
  expect(
    farmerInputSchema.safeParse({
      name: "DEMO Farmer",
      village: "DEMO Village",
      businessId: "DEMO",
    }).success,
  ).toBe(false);
});

it("checks receipt dates and positive integer paise", () => {
  const receipt = {
    invoiceId: "DEMO-invoice",
    amountPaise: 200000,
    method: "CASH",
    paymentDate: "2026-11-24",
  };
  expect(receiptInputSchema.safeParse(receipt).success).toBe(true);
  expect(
    receiptInputSchema.safeParse({ ...receipt, amountPaise: 0 }).success,
  ).toBe(false);
  expect(
    receiptInputSchema.safeParse({ ...receipt, paymentDate: "2026-02-30" })
      .success,
  ).toBe(false);
});

it("requires custom pricing fields and whole trip quantities", () => {
  const line = {
    serviceId: "DEMO-service",
    equipmentIds: [],
    unit: "ACRE",
    quantity: "3.5",
    pricingMode: "CUSTOM_RATE",
    agreedRatePaise: 170000,
  };
  expect(workLineSchema.safeParse(line).success).toBe(true);
  expect(workLineSchema.safeParse({ ...line, unit: "TRIP" }).success).toBe(
    false,
  );
  expect(
    workLineSchema.safeParse({ ...line, agreedRatePaise: undefined }).success,
  ).toBe(false);
});
