import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  createInvoiceService,
  type AcceptedJobSnapshot,
} from "../services/invoice.service";
import { renderInvoicePdf } from "../services/invoice.pdf";
import { memoryInvoices } from "./memory-invoices";

function job(id: string): AcceptedJobSnapshot {
  return {
    id,
    farmerId: "farmer-1",
    workDate: "2026-11-25",
    state: "COMPLETED",
    invoiceId: null,
    farmer: { name: "Ravi", village: "North" },
    owner: { name: "Kisan Machinery", address: "North" },
    lines: [
      {
        lineId: `${id}-1`,
        serviceId: "tractor",
        equipmentIds: ["tractor"],
        serviceNameSnapshot: "Ploughing",
        unit: "ACRE",
        quantity: "3.5",
        defaultRateSnapshotPaise: 170000,
        totalPaise: 595000,
      },
      {
        lineId: `${id}-2`,
        serviceId: "trolley",
        equipmentIds: ["trolley"],
        serviceNameSnapshot: "Trolley",
        unit: "TRIP",
        quantity: "2",
        defaultRateSnapshotPaise: 50000,
        totalPaise: 100000,
      },
    ],
    totalPaise: 695000,
  };
}
describe("invoice issuance", () => {
  const repository = memoryInvoices([
    { businessId: "a", job: job("job-a") },
    { businessId: "a", job: job("job-b") },
    { businessId: "b", job: job("job-foreign") },
  ]);
  const service = createInvoiceService(repository);
  it("issues unique sequential numbers under concurrent calls and repeats idempotently", async () => {
    const [first, second, repeat] = await Promise.all([
      service.issue("a", "job-a"),
      service.issue("a", "job-b"),
      service.issue("a", "job-a"),
    ]);
    expect(new Set([first.invoiceNumber, second.invoiceNumber]).size).toBe(2);
    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(repeat.id).toBe(first.id);
    expect(first.totalPaise).toBe(
      first.lines.reduce((total, line) => total + line.amountPaise, 0),
    );
    expect(await repository.get("b", first.id)).toBeNull();
    expect(await repository.void("b", first.id, "Wrong work")).toBeNull();
  });
  it("prints the stored total and prevents a second void", async () => {
    const invoice = await service.issue("b", "job-foreign");
    const document = await getDocument({
      data: new Uint8Array(await renderInvoicePdf(invoice)),
      useSystemFonts: true,
    }).promise;
    const page = await document.getPage(1);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    expect(text).toContain("INR 6950.00");
    expect(text).toContain(invoice.invoiceNumber);
    expect((await service.void("b", invoice.id, "Wrong work")).status).toBe(
      "VOID",
    );
    await expect(service.void("b", invoice.id, "Again")).rejects.toThrow();
  });
});
