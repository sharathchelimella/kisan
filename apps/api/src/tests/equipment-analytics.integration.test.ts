import { afterAll, beforeAll, expect, it } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";
import { createAuthService } from "../services/auth.service";
import { memoryAuth } from "./memory-auth";
import { mongoCatalog } from "../services/catalog.repository";
import { EquipmentModel } from "../models/Equipment.model";
import { JobModel } from "../models/Job.model";

let database: MongoMemoryServer;
let server: Server;
let base: string;
let cookie: string;
let businessId: string;
beforeAll(async () => {
  database = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
  });
  await mongoose.connect(database.getUri());
  const owners = memoryAuth();
  const auth = createAuthService(owners);
  const session = await owners.createOwner({
    email: "analytics@example.test",
    passwordHash: "unused",
    displayName: "DEMO",
    businessName: "DEMO",
    village: "DEMO",
    preferredLanguage: "en",
  });
  if (!session) throw new Error("Fixture unavailable");
  businessId = new mongoose.Types.ObjectId().toHexString();
  session.business.id = businessId;
  const read = owners.readMembership;
  owners.readMembership = async (identity) =>
    identity.userId === session.owner.id && identity.businessId === businessId
      ? session
      : read(identity);
  cookie = "kisan_session=" + (await auth.start(session));
  server = createApp({ auth, catalog: mongoCatalog }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TCP required");
  base = `http://127.0.0.1:${address.port}/api/v1`;
}, 120_000);
afterAll(async () => {
  if (server?.listening)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await database?.stop();
});
it("serves tenant scoped unique business and per machine analytics", async () => {
  const tractor = await EquipmentModel.create({
    businessId,
    name: "Tractor",
    kind: "TRACTOR",
    active: true,
    availabilityRecords: [{ from: "2026-11-01", to: "2026-11-30", hours: 6 }],
  });
  const tool = await EquipmentModel.create({
    businessId,
    name: "Tool",
    kind: "ROTAVATOR",
    active: true,
  });
  await JobModel.create({
    businessId,
    farmerId: new mongoose.Types.ObjectId(),
    workDate: "2026-11-20",
    village: "Village",
    state: "COMPLETED",
    totalPaise: 600000,
    createdBy: new mongoose.Types.ObjectId(),
    lines: [
      {
        lineId: "line",
        serviceId: new mongoose.Types.ObjectId(),
        serviceNameSnapshot: "Rotavation",
        equipmentIds: [tractor._id, tool._id],
        unit: "ACRE",
        quantity: "4",
        operatingHours: "3",
        pricingMode: "DEFAULT_RATE",
        defaultRateSnapshotPaise: 150000,
        totalPaise: 600000,
      },
    ],
  });
  const response = await fetch(base + "/equipment/analytics", {
    headers: { Cookie: cookie },
  });
  expect(response.status).toBe(200);
  const data = (await response.json()).data;
  expect(data.totalCompletedJobs).toBe(1);
  expect(data.businessWorkPaise).toBe(600000);
  expect(data.byId[tractor.id].completedJobs).toBe(1);
  expect(data.byId[tool.id].associatedWorkPaise).toBe(600000);
  const period = await fetch(
    base + "/equipment/analytics?from=2026-11-01&to=2026-11-30",
    { headers: { Cookie: cookie } },
  );
  expect((await period.json()).data.byId[tractor.id].utilizationPct).toBe(50);
  const empty = await fetch(base + "/equipment/analytics?from=2026-11-21", {
    headers: { Cookie: cookie },
  });
  expect((await empty.json()).data.totalCompletedJobs).toBe(0);
});
