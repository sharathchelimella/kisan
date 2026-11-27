import PDFDocument from "pdfkit";
import type { Invoice } from "@kisan/contracts";

const money = (paise: number) => `INR ${(paise / 100).toFixed(2)}`;
export function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    pdf.fontSize(20).text(invoice.ownerSnapshot.name);
    pdf.fontSize(10).text(invoice.ownerSnapshot.address ?? "");
    pdf.moveDown().fontSize(16).text(`Invoice ${invoice.invoiceNumber}`);
    pdf
      .fontSize(10)
      .text(
        `Issued: ${invoice.issuedAt.slice(0, 10)}    Work date: ${invoice.workDate}`,
      );
    pdf.moveDown().text(`Farmer: ${invoice.farmerSnapshot.name}`);
    pdf.text(`Village: ${invoice.farmerSnapshot.village}`);
    if (invoice.farmerSnapshot.mobile)
      pdf.text(`Phone: ${invoice.farmerSnapshot.mobile}`);
    pdf.moveDown();
    for (const line of invoice.lines) {
      pdf.text(
        `${line.serviceName} | ${line.quantity} ${line.unit} | ${money(line.amountPaise)}`,
      );
      pdf.moveDown(0.4);
    }
    pdf
      .moveDown()
      .fontSize(14)
      .text(`Total: ${money(invoice.totalPaise)}`);
    pdf
      .fontSize(10)
      .text(
        `Paid: ${money(invoice.paidPaise)}    Due: ${money(invoice.duePaise)}`,
      );
    if (invoice.lifecycle === "VOID")
      pdf.moveDown().text(`VOID: ${invoice.voidReason ?? ""}`);
    pdf.end();
  });
}
