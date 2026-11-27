import { memoryJobReads } from "./memory-job-reads";
import { memoryInvoices } from "./memory-invoices";
import { memoryPayments } from "./memory-payments";
import { memoryDashboard } from "./memory-dashboard";
import { memoryReports } from "./memory-reports";
import { memorySettings } from "./memory-settings";

import { memoryJobPorts } from "./memory-jobs";
import { createMemoryCatalog } from "@kisan/contracts/catalog-memory";
import { createMemoryFarmerRepository } from "@kisan/contracts/farmer-memory";
import { createApp } from "../app";
import { createAuthService } from "../services/auth.service";
import { memoryAuth } from "./memory-auth";

if (process.env.NODE_ENV !== "test")
  throw new Error("This server is for browser tests only");
const auth = createAuthService(
  memoryAuth(),
  "DEMO-playwright-secret-for-verified-registration",
);
createApp({
  auth,
  farmers: createMemoryFarmerRepository(),
  catalog: createMemoryCatalog(),
  jobs: memoryJobPorts([], []),

  jobReads: memoryJobReads(),
  invoices: memoryInvoices(),
  payments: memoryPayments(),
  dashboard: memoryDashboard(),
  reports: memoryReports(),
  settings: memorySettings(),
}).listen(3101, "127.0.0.1");
