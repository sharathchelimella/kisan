import { createJobReadRouter } from "./routes/job-read.routes";
import { createInvoiceRouter } from "./routes/invoice.routes";
import { createPaymentRouter } from "./routes/payment.routes";
import { createDashboardRouter } from "./routes/dashboard.routes";
import { createReportRouter } from "./routes/report.routes";
import { createSettingsRouter } from "./routes/settings.routes";
import { mongoSettings } from "./services/settings.repository";
import type { SettingsRepository } from "./services/settings.service";
import { mongoReports } from "./services/report.repository";
import type { ReportReadRepository } from "./services/report.service";
import { mongoDashboard } from "./services/dashboard.repository";
import type { DashboardReadRepository } from "./services/dashboard.service";
import { mongoPayments } from "./services/payment.repository";
import type { PaymentRepository } from "./services/payment.service";
import { mongoInvoices } from "./services/invoice.repository";
import type { InvoiceRepository } from "./services/invoice.service";

import {
  mongoJobReads,
  type JobReadRepository,
} from "./services/job-read.repository";

import { createJobRouter } from "./routes/job.routes";
import { mongoJobPorts, type JobPorts } from "./services/job.service";
import { createCatalogRouter } from "./routes/catalog.routes";
import {
  mongoCatalog,
  type CatalogRepository,
} from "./services/catalog.repository";
import { createFarmerRouter } from "./routes/farmer.routes";
import {
  mongoFarmers,
  type FarmerRepository,
} from "./services/farmer.repository";
import express from "express";
import { API_PREFIX } from "@kisan/contracts";
import { healthRouter } from "./routes/health.routes";
import { requestId } from "./middleware/request-id";
import { handleError, notFound } from "./middleware/errors";
import { createAuthRouter } from "./routes/auth.routes";
import type { AuthService } from "./services/auth.service";

export function createApp(
  options: {
    auth?: AuthService;
    farmers?: FarmerRepository;
    catalog?: CatalogRepository;
    jobs?: JobPorts;

    jobReads?: JobReadRepository;
    invoices?: InvoiceRepository;
    payments?: PaymentRepository;
    dashboard?: DashboardReadRepository;
    reports?: ReportReadRepository;
    settings?: SettingsRepository;
    secureCookies?: boolean;
  } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    if (options.secureCookies)
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    next();
  });
  app.use(API_PREFIX, healthRouter);
  app.use(
    `${API_PREFIX}/auth`,
    createAuthRouter(options.auth, options.secureCookies ?? false),
  );
  app.use(
    API_PREFIX + "/farmers",
    createFarmerRouter(options.auth, options.farmers ?? mongoFarmers),
  );
  app.use(
    API_PREFIX,
    createCatalogRouter(options.auth, options.catalog ?? mongoCatalog),
  );
  app.use(
    API_PREFIX + "/jobs",
    createJobRouter(options.auth, options.jobs ?? mongoJobPorts),
  );
  app.use(
    API_PREFIX + "/jobs",
    createJobReadRouter(options.auth, options.jobReads ?? mongoJobReads),
  );
  app.use(
    API_PREFIX + "/invoices",
    createInvoiceRouter(options.auth, options.invoices ?? mongoInvoices),
  );
  app.use(
    API_PREFIX + "/payments",
    createPaymentRouter(options.auth, options.payments ?? mongoPayments),
  );
  app.use(
    API_PREFIX + "/dashboard",
    createDashboardRouter(options.auth, options.dashboard ?? mongoDashboard),
  );
  app.use(
    API_PREFIX + "/reports",
    createReportRouter(options.auth, options.reports ?? mongoReports),
  );
  app.use(
    API_PREFIX + "/settings",
    createSettingsRouter(options.auth, options.settings ?? mongoSettings),
  );

  app.use(notFound);
  app.use(handleError);
  return app;
}
