import { expect, it } from "vitest";
import type { Invoice } from "@kisan/contracts";
import { equipmentDue } from "@kisan/domain";
import { createPaymentService } from "../services/payment.service";
import { memoryPayments } from "./memory-payments";

const invoice: Invoice = {
  id: "invoice-1",
  jobId: "job-1",
  farmerId: "farmer-1",
  invoiceNumber: "KMM-000001",
  sequence: 1,
  lifecycle: "ISSUED",
  issuedAt: "2026-11-25T00:00:00Z",
  workDate: "2026-11-25",
  farmerSnapshot: { name: "Ravi", village: "North" },
  ownerSnapshot: { name: "Kisan" },
  lines: [
    {
      lineId: "line-1",
      serviceId: "plough",
      equipmentIds: ["tractor"],
      serviceName: "Plough",
      unit: "ACRE",
      quantity: "1",
      amountPaise: 300000,
    },
    {
      lineId: "line-2",
      serviceId: "rotavator",
      equipmentIds: ["rotavator"],
      serviceName: "Rotavator",
      unit: "ACRE",
      quantity: "1",
      amountPaise: 200000,
    },
  ],
  totalPaise: 500000,
  paidPaise: 0,
  duePaise: 500000,
  status: "UNPAID",
  version: 1,
};
it("posts partial and full receipts once, rejects overpay, reverses with audit and isolates tenants", async () => {
  const paymentInvoice: Invoice = {
    ...invoice,
    lines: [
      { ...invoice.lines[0], amountPaise: 450000 },
      { ...invoice.lines[1], amountPaise: 300000 },
    ],
    totalPaise: 750000,
    duePaise: 750000,
  };
  const repository = memoryPayments([
    { businessId: "a", invoice: paymentInvoice },
  ]);
  const service = createPaymentService(repository);
  const input = {
    invoiceId: invoice.id,
    amountPaise: 300000,
    method: "CASH",
    paymentDate: "2026-11-25",
  };
  const first = await service.post("a", "owner", "payment-key-001", input);
  expect(first.invoice.status).toBe("PARTIAL");
  expect(first.invoice.duePaise).toBe(450000);
  const repeat = await service.post("a", "owner", "payment-key-001", input);
  expect(repeat.receipt.id).toBe(first.receipt.id);
  await expect(
    service.post("a", "owner", "payment-key-001", { ...input, amountPaise: 1 }),
  ).rejects.toThrow();
  await expect(
    service.post("a", "owner", "payment-key-002", {
      ...input,
      amountPaise: 450001,
    }),
  ).rejects.toThrow();
  expect(
    (
      await service.post("a", "owner", "payment-key-003", {
        ...input,
        amountPaise: 450000,
      })
    ).invoice.status,
  ).toBe("PAID");
  const reversed = await service.reverse(
    "a",
    "owner",
    first.receipt.id,
    "Wrong payment",
  );
  expect(reversed.invoice.duePaise).toBe(300000);
  expect(reversed.receipt.reversalReason).toBe("Wrong payment");
  await expect(
    service.reverse("a", "owner", first.receipt.id, "Again"),
  ).rejects.toThrow();
  expect((await service.dues("b", { page: 1, pageSize: 20 })).total).toBe(0);
});
it("attributes mixed invoice due to equipment without duplicating the full balance", () => {
  const partial = {
    ...invoice,
    paidPaise: 250000,
    duePaise: 250000,
    status: "PARTIAL" as const,
  };
  expect(equipmentDue(partial, "tractor")).toBe(150000);
  expect(equipmentDue(partial, "rotavator")).toBe(100000);
  expect(
    equipmentDue(partial, "tractor") + equipmentDue(partial, "rotavator"),
  ).toBe(partial.duePaise);
  const packageLine = {
    ...partial,
    lines: [
      {
        ...partial.lines[0],
        equipmentIds: ["tractor", "rotavator"],
        amountPaise: 500000,
      },
    ],
  };
  expect(
    equipmentDue(packageLine, "tractor") +
      equipmentDue(packageLine, "rotavator"),
  ).toBe(packageLine.duePaise);
});
