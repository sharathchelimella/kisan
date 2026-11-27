import type { ID } from "./common";
import type { Farmer } from "./farmer.contract";
import type { Service } from "./machinery.contract";
import type { Job } from "./job.contract";
import type { Invoice, InvoiceBalance } from "./invoice.contract";
import type { ReceiptInput } from "./payment.contract";
import type { Dashboard } from "./dashboard.contract";

export interface FarmerLookupPort {
  findFarmer(businessId: ID, id: ID): Promise<Farmer | null>;
}
export interface ServiceLookupPort {
  findService(businessId: ID, id: ID): Promise<Service | null>;
}
export interface CompletedJobReader {
  findCompletedJob(businessId: ID, id: ID): Promise<Job | null>;
}
export interface InvoiceReader {
  findInvoice(businessId: ID, id: ID): Promise<Invoice | null>;
}
export interface InvoicePaymentWriter {
  postReceipt(
    context: { businessId: ID; actorId: ID; idempotencyKey: string },
    input: ReceiptInput,
  ): Promise<InvoiceBalance>;
}
export interface FinancialReadModel {
  getDashboard(
    businessId: ID,
    query: Pick<Dashboard, "from" | "to" | "asOf">,
  ): Promise<Dashboard>;
}
