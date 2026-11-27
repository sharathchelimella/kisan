import { type AddressInfo } from "node:net";
import type { Server } from "node:http";
import { existsSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterAll, beforeAll, expect, it } from "vitest";
import { issueRegistrationCode } from "../services/auth.crypto";
import { createAuthService } from "../services/auth.service";
import {
  initializeAuthCollections,
  mongoAuthRepository,
} from "../services/auth.repository";
import { createApp } from "../app";
import { FarmerModel } from "../models/Farmer.model";
import { EquipmentModel } from "../models/Equipment.model";
import { ServiceModel } from "../models/Service.model";
import { JobModel } from "../models/Job.model";
import { InvoiceModel } from "../models/Invoice.model";
import { ReceiptModel } from "../models/Receipt.model";
import { AllocationModel } from "../models/Allocation.model";
import { reconcileBusiness } from "../services/reconciliation.repository";

const secret = "P90-test-registration-secret-1234567890";
let replica: MongoMemoryReplSet;
let server: Server;
let base: string;

beforeAll(async () => {
  const windowsMongo =
    "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe";
  replica = await MongoMemoryReplSet.create({
    binary: {
      systemBinary:
        process.env.MONGOMS_SYSTEM_BINARY ??
        (process.platform === "win32" && existsSync(windowsMongo)
          ? windowsMongo
          : undefined),
    },
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: 60_000 }],
  });
  await mongoose.connect(replica.getUri());
  await initializeAuthCollections();
  for (const model of [
    FarmerModel,
    EquipmentModel,
    ServiceModel,
    JobModel,
    InvoiceModel,
    ReceiptModel,
    AllocationModel,
  ])
    await model.createIndexes();
  server = createApp({
    auth: createAuthService(mongoAuthRepository, secret),
  }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
}, 120_000);

afterAll(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await mongoose.disconnect();
  if (replica) await replica.stop();
}, 60_000);

async function api(
  path: string,
  options: {
    method?: string;
    cookie?: string;
    body?: unknown;
    key?: string;
  } = {},
) {
  const response = await fetch(base + path, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined && {
        "Content-Type": "application/json",
        "X-Kisan-Request": "1",
      }),
      ...(options.cookie && { Cookie: options.cookie }),
      ...(options.key && { "Idempotency-Key": options.key }),
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });
  const data = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? ((await response.json()) as { data?: unknown; error?: unknown })
    : null;
  return {
    status: response.status,
    data: data?.data,
    error: data?.error,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    response,
  };
}

async function owner(suffix: string) {
  const email = `p90-${suffix}@example.test`;
  const registration = await api("/auth/register", {
    method: "POST",
    body: {
      email,
      password: "Long password 123!",
      displayName: `Owner ${suffix}`,
      businessName: `Business ${suffix}`,
      village: "Village",
      preferredLanguage: "en",
      verificationCode: issueRegistrationCode(
        email,
        secret,
        Math.floor(Date.now() / 1000) + 3600,
      ),
    },
  });
  expect(registration.status).toBe(201);
  const login = await api("/auth/login", {
    method: "POST",
    body: { email, password: "Long password 123!" },
  });
  expect(login.status).toBe(200);
  expect(login.cookie).toBeTruthy();
  return login.cookie!;
}

it("reconciles real tenant-scoped work, invoice, receipts and reports", async () => {
  expect((await api("/ready")).status).toBe(200);
  const a = await owner("a");
  const b = await owner("b");
  const membership = await api("/auth/me", { cookie: a });
  const businessId = (membership.data as { business: { id: string } }).business
    .id;
  const settings = await api("/settings", {
    method: "PATCH",
    cookie: a,
    body: { phone: "9876543210", address: "Old Farm Road" },
  });
  expect(settings.status).toBe(200);
  const language = await api("/settings", {
    method: "PATCH",
    cookie: a,
    body: { preferredLanguage: "te" },
  });
  expect(language.status).toBe(200);
  expect(language.data).toMatchObject({
    preferredLanguage: "te",
    phone: "9876543210",
  });
  const create = (path: string, body: unknown, cookie = a) =>
    api(path, { method: "POST", cookie, body });
  const farmer = await create("/farmers", {
    name: "Ramesh",
    village: "Village",
  });
  expect(farmer.status).toBe(201);
  const farmerId = (farmer.data as { id: string }).id;
  const equipment = await create("/equipment", {
    name: "Rotavator",
    kind: "TRACTOR",
    active: true,
  });
  expect(equipment.status).toBe(201);
  const equipmentId = (equipment.data as { id: string }).id;
  const service = await create("/services", {
    name: "Rotavator work",
    unit: "ACRE",
    defaultRatePaise: 150000,
    equipmentIds: [equipmentId],
    active: true,
  });
  expect(service.status).toBe(201);
  const serviceId = (service.data as { id: string }).id;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const workDate = `${today.slice(0, 7)}-01`;
  const job = await create("/jobs", {
    farmerId,
    workDate,
    village: "Village",
    state: "COMPLETED",
    lines: [
      {
        serviceId,
        equipmentIds: [equipmentId],
        unit: "ACRE",
        quantity: "3.5",
        pricingMode: "CUSTOM_RATE",
        agreedRatePaise: 170000,
      },
    ],
  });
  expect(job.status).toBe(201);
  expect((job.data as { totalPaise: number }).totalPaise).toBe(595000);
  const jobId = (job.data as { id: string }).id;
  const issue = await create("/invoices", { jobId });
  expect(issue.status).toBe(201);
  const invoice = issue.data as {
    id: string;
    invoiceNumber: string;
    totalPaise: number;
    duePaise: number;
    lines: { amountPaise: number }[];
  };
  expect(invoice.totalPaise).toBe(595000);
  expect(invoice.lines.map((line) => line.amountPaise)).toEqual([595000]);
  expect(issue.data).toMatchObject({
    ownerSnapshot: { address: "Old Farm Road", phone: "9876543210" },
  });
  expect(
    (
      await api("/settings", {
        method: "PATCH",
        cookie: a,
        body: { address: "New Farm Road" },
      })
    ).status,
  ).toBe(200);
  expect(
    (await api(`/invoices/${invoice.id}`, { cookie: a })).data,
  ).toMatchObject({ ownerSnapshot: { address: "Old Farm Road" } });
  expect((await create("/invoices", { jobId })).data).toMatchObject({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  });
  expect((await api(`/invoices/${invoice.id}`, { cookie: b })).status).toBe(
    404,
  );
  expect((await api(`/farmers/${farmerId}`, { cookie: b })).status).toBe(404);

  const payment = (amountPaise: number, method: "CASH" | "UPI", key: string) =>
    api("/payments/receipts", {
      method: "POST",
      cookie: a,
      key,
      body: { invoiceId: invoice.id, amountPaise, method, paymentDate: today },
    });
  const first = await payment(200000, "CASH", "p90-first-payment");
  expect(first.status).toBe(201);
  expect(
    (first.data as { invoice: { duePaise: number; status: string } }).invoice,
  ).toMatchObject({ duePaise: 395000, status: "PARTIAL" });
  const second = await payment(395000, "UPI", "p90-final-payment");
  expect(second.status).toBe(201);
  expect(
    (second.data as { invoice: { duePaise: number; status: string } }).invoice,
  ).toMatchObject({ duePaise: 0, status: "PAID" });
  expect(
    (await payment(200000, "CASH", "p90-first-payment")).data,
  ).toMatchObject({
    receipt: { id: (first.data as { receipt: { id: string } }).receipt.id },
  });
  expect((await payment(1, "CASH", "p90-overdue-payment")).status).toBe(409);
  const receipts = await api("/payments/receipts", { cookie: a });
  expect((receipts.data as { items: unknown[] }).items).toHaveLength(2);
  expect((await api("/payments/receipts", { cookie: b })).data).toMatchObject({
    total: 0,
  });
  const dashboard = await api(
    `/dashboard?from=${workDate}&to=${today}&asOf=${today}`,
    { cookie: a },
  );
  expect(dashboard.status).toBe(200);
  expect(dashboard.data).toMatchObject({
    workValuePaise: 595000,
    collectionsPaise: 595000,
    outstandingPaise: 0,
  });
  const report = await api(
    `/reports?from=${workDate}&to=${today}&asOf=${today}&groupBy=month`,
    { cookie: a },
  );
  expect(report.status).toBe(200);
  expect(report.data).toMatchObject({
    summary: {
      workValuePaise: 595000,
      collectionsPaise: 595000,
      outstandingPaise: 0,
    },
  });
  expect(
    (
      await api(
        `/reports?from=${workDate}&to=${today}&asOf=${today}&groupBy=month`,
        { cookie: b },
      )
    ).data,
  ).toMatchObject({
    summary: { workValuePaise: 0, collectionsPaise: 0, outstandingPaise: 0 },
  });
  expect(await reconcileBusiness(businessId)).toEqual([]);
}, 120_000);

it("keeps mixed-service history, period figures, PDF and concurrent balances consistent", async () => {
  const cookie = await owner("c");
  const membership = await api("/auth/me", { cookie });
  const businessId = (membership.data as { business: { id: string } }).business
    .id;
  const create = (path: string, body: unknown) =>
    api(path, { method: "POST", cookie, body });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const previousMonthDate = new Date(
    Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 15),
  )
    .toISOString()
    .slice(0, 10);
  const farmer = await create("/farmers", { name: "Ramesh", village: "North" });
  const farmerId = (farmer.data as { id: string }).id;
  const rotavator = await create("/equipment", {
    name: "Rotavator",
    kind: "TRACTOR",
    active: true,
  });
  const trolley = await create("/equipment", {
    name: "Trolley",
    kind: "TRAILER",
    active: true,
  });
  const rotavatorId = (rotavator.data as { id: string }).id;
  const trolleyId = (trolley.data as { id: string }).id;
  const acreService = await create("/services", {
    name: "Rotavator work",
    unit: "ACRE",
    defaultRatePaise: 170000,
    equipmentIds: [rotavatorId],
    active: true,
  });
  const tripService = await create("/services", {
    name: "Trolley trip",
    unit: "TRIP",
    defaultRatePaise: 50000,
    equipmentIds: [trolleyId],
    active: true,
  });
  const acreId = (acreService.data as { id: string }).id;
  const tripId = (tripService.data as { id: string }).id;
  const job = await create("/jobs", {
    farmerId,
    workDate: previousMonthDate,
    village: "North",
    state: "COMPLETED",
    lines: [
      {
        serviceId: acreId,
        equipmentIds: [rotavatorId],
        unit: "ACRE",
        quantity: "1",
        pricingMode: "DEFAULT_RATE",
      },
      {
        serviceId: tripId,
        equipmentIds: [trolleyId],
        unit: "TRIP",
        quantity: "2",
        pricingMode: "DEFAULT_RATE",
      },
    ],
  });
  expect(job.status).toBe(201);
  const jobId = (job.data as { id: string; totalPaise: number }).id;
  expect((job.data as { totalPaise: number }).totalPaise).toBe(270000);
  const issued = await create("/invoices", { jobId });
  expect(issued.status).toBe(201);
  const invoice = issued.data as {
    id: string;
    invoiceNumber: string;
    lines: { amountPaise: number }[];
  };
  expect(invoice.lines.map((line) => line.amountPaise)).toEqual([
    170000, 100000,
  ]);
  const changed = await api(`/services/${acreId}`, {
    method: "PATCH",
    cookie,
    body: { defaultRatePaise: 190000 },
  });
  expect(changed.status).toBe(200);
  expect((await api(`/invoices/${invoice.id}`, { cookie })).data).toMatchObject(
    {
      totalPaise: 270000,
      lines: [{ amountPaise: 170000 }, { amountPaise: 100000 }],
    },
  );
  const pdfResponse = await api(`/invoices/${invoice.id}/pdf`, { cookie });
  expect(pdfResponse.status).toBe(200);
  const pdf = await getDocument({
    data: new Uint8Array(await pdfResponse.response.arrayBuffer()),
    useSystemFonts: true,
  }).promise;
  const pdfPage = await pdf.getPage(1);
  const pdfText = (await pdfPage.getTextContent()).items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ");
  expect(pdfText).toContain(invoice.invoiceNumber);
  expect(pdfText).toContain("INR 2700.00");

  const before = await api(`/payments/dues?equipmentId=${rotavatorId}`, {
    cookie,
  });
  expect(before.status).toBe(200);
  expect((before.data as { totalDuePaise: number }).totalDuePaise).toBe(170000);
  const trolleyDue = await api(`/payments/dues?equipmentId=${trolleyId}`, {
    cookie,
  });
  expect((trolleyDue.data as { totalDuePaise: number }).totalDuePaise).toBe(
    100000,
  );
  const post = (key: string) =>
    api("/payments/receipts", {
      method: "POST",
      cookie,
      key,
      body: {
        invoiceId: invoice.id,
        amountPaise: 200000,
        method: "CASH",
        paymentDate: today,
      },
    });
  const [one, two] = await Promise.all([
    post("p90-concurrent-one"),
    post("p90-concurrent-two"),
  ]);
  expect([one.status, two.status].sort()).toEqual([201, 409]);
  const winner = one.status === 201 ? one : two;
  expect(
    (winner.data as { invoice: { duePaise: number } }).invoice.duePaise,
  ).toBe(70000);
  const rotavatorDueAfter = await api(
    `/payments/dues?equipmentId=${rotavatorId}`,
    { cookie },
  );
  const trolleyDueAfter = await api(`/payments/dues?equipmentId=${trolleyId}`, {
    cookie,
  });
  expect(
    (rotavatorDueAfter.data as { totalDuePaise: number }).totalDuePaise +
      (trolleyDueAfter.data as { totalDuePaise: number }).totalDuePaise,
  ).toBe(70000);
  const currentInvoice = await api(`/invoices/${invoice.id}`, { cookie });
  expect(currentInvoice.data).toMatchObject({
    paidPaise: 200000,
    duePaise: 70000,
    status: "PARTIAL",
  });
  const previousDashboard = await api(
    `/dashboard?from=${previousMonthDate.slice(0, 7)}-01&to=${previousMonthDate}&asOf=${today}`,
    { cookie },
  );
  expect(previousDashboard.data).toMatchObject({
    workValuePaise: 270000,
    collectionsPaise: 0,
    outstandingPaise: 70000,
  });
  const currentReport = await api(
    `/reports?from=${today.slice(0, 7)}-01&to=${today}&asOf=${today}&groupBy=month`,
    { cookie },
  );
  expect(currentReport.data).toMatchObject({
    summary: {
      workValuePaise: 0,
      collectionsPaise: 200000,
      outstandingPaise: 70000,
    },
  });
  const receiptId = (winner.data as { receipt: { id: string } }).receipt.id;
  const reversed = await create(`/payments/receipts/${receiptId}/reverse`, {
    reason: "Wrong payment",
  });
  expect(reversed.status).toBe(200);
  expect(
    (reversed.data as { invoice: { duePaise: number } }).invoice.duePaise,
  ).toBe(270000);
  expect((await api(`/invoices/${invoice.id}`, { cookie })).data).toMatchObject(
    { paidPaise: 0, duePaise: 270000, status: "UNPAID" },
  );
  expect((await api(`/payments/receipts`, { cookie })).data).toMatchObject({
    total: 1,
    items: [{ status: "REVERSED" }],
  });
  const ploughJob = await create("/jobs", {
    farmerId,
    workDate: today,
    village: "North",
    state: "COMPLETED",
    lines: [
      {
        serviceId: acreId,
        equipmentIds: [rotavatorId],
        unit: "ACRE",
        quantity: "1",
        pricingMode: "DEFAULT_RATE",
      },
    ],
  });
  const trolleyJob = await create("/jobs", {
    farmerId,
    workDate: today,
    village: "North",
    state: "COMPLETED",
    lines: [
      {
        serviceId: tripId,
        equipmentIds: [trolleyId],
        unit: "TRIP",
        quantity: "1",
        pricingMode: "DEFAULT_RATE",
      },
    ],
  });
  expect([ploughJob.status, trolleyJob.status]).toEqual([201, 201]);
  const records = await api(`/jobs?farmerId=${farmerId}`, { cookie });
  expect((records.data as { total: number }).total).toBe(3);
  const filtered = await api(`/jobs?farmerId=${farmerId}&serviceId=${tripId}`, {
    cookie,
  });
  expect((filtered.data as { total: number }).total).toBe(2);
  expect(await reconcileBusiness(businessId)).toEqual([]);
  await InvoiceModel.updateOne(
    { _id: invoice.id, businessId },
    { $inc: { paidPaise: 1 } },
  );
  expect(await reconcileBusiness(businessId)).toContainEqual({
    code: "INVOICE_BALANCE",
    invoiceId: invoice.id,
  });
  await InvoiceModel.updateOne(
    { _id: invoice.id, businessId },
    { $inc: { paidPaise: -1 } },
  );
  expect(await reconcileBusiness(businessId)).toEqual([]);
}, 120_000);
