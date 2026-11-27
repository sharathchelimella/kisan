import { beforeAll, afterAll, expect, it } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";
import { createAuthService } from "../services/auth.service";
import { memoryAuth } from "./memory-auth";
import { mongoCatalog } from "../services/catalog.repository";
import { EquipmentModel } from "../models/Equipment.model";
import { ServiceModel } from "../models/Service.model";

let database: MongoMemoryServer;
let server: Server;
let url: string;
let cookieA: string;
let cookieB: string;
beforeAll(async () => {
  database = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
  });
  await mongoose.connect(database.getUri());
  await EquipmentModel.createIndexes();
  await ServiceModel.createIndexes();
  const owners = memoryAuth();
  const auth = createAuthService(owners);
  async function owner(email: string) {
    const session = await owners.createOwner({
      email,
      passwordHash: "unused",
      displayName: "DEMO",
      businessName: "DEMO",
      village: "DEMO",
      preferredLanguage: "en",
    });
    if (!session) throw new Error("Fixture creation failed");
    // Real Mongo identifiers for catalog ownership, independent of the memory auth fixture.
    session.business.id = new mongoose.Types.ObjectId().toHexString();
    const originalRead = owners.readMembership;
    owners.readMembership = async (identity) =>
      identity.userId === session.owner.id &&
      identity.businessId === session.business.id
        ? session
        : originalRead(identity);
    return "kisan_session=" + (await auth.start(session));
  }
  cookieA = await owner("a@example.test");
  cookieB = await owner("b@example.test");
  server = createApp({ auth, catalog: mongoCatalog }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TCP required");
  url = `http://127.0.0.1:${address.port}/api/v1`;
}, 120_000);
afterAll(async () => {
  if (server?.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await mongoose.disconnect();
  await database?.stop();
});
function request(
  path: string,
  method = "GET",
  body?: object,
  cookie = cookieA,
) {
  return fetch(url + path, {
    method,
    headers: {
      cookie,
      "Content-Type": "application/json",
      "X-Kisan-Request": "1",
    },
    ...(body && { body: JSON.stringify(body) }),
  });
}
it("isolates equipment and validates linked services and pricing units through HTTP", async () => {
  expect((await request("/equipment", "GET", undefined, "")).status).toBe(401);
  expect(
    (
      await request("/equipment", "POST", {
        name: "DEMO",
        kind: "TRACTOR",
        active: true,
        businessId: "forged",
      })
    ).status,
  ).toBe(422);
  const firstResponse = await request("/equipment", "POST", {
    name: "DEMO Tractor",
    kind: "TRACTOR",
    active: true,
  });
  expect(firstResponse.status).toBe(201);
  const tractor = (await firstResponse.json()).data;
  const plough = (
    await (
      await request("/equipment", "POST", {
        name: "DEMO Plough",
        kind: "PLOUGH",
        active: true,
      })
    ).json()
  ).data;
  const other = (
    await (
      await request(
        "/equipment",
        "POST",
        { name: "DEMO Foreign", kind: "CUSTOM", active: true },
        cookieB,
      )
    ).json()
  ).data;
  expect((await (await request("/equipment")).json()).data.total).toBe(2);
  expect(
    (await (await request("/equipment?pageSize=1&page=2")).json()).data.items,
  ).toHaveLength(1);
  expect(
    (await request("/equipment/" + other.id, "PATCH", { active: false }))
      .status,
  ).toBe(404);
  const input = {
    name: "DEMO Ploughing",
    unit: "ACRE",
    defaultRatePaise: 170000,
    equipmentIds: [tractor.id, plough.id],
    active: true,
  };
  expect(
    (await request("/services", "POST", { ...input, equipmentIds: [other.id] }))
      .status,
  ).toBe(422);
  expect(
    (
      await request("/services", "POST", {
        ...input,
        equipmentIds: [tractor.id, tractor.id],
      })
    ).status,
  ).toBe(422);
  for (const amount of [-1, 0.1, Number.MAX_SAFE_INTEGER + 1]) {
    expect(
      (
        await request("/services", "POST", {
          ...input,
          defaultRatePaise: amount,
        })
      ).status,
    ).toBe(422);
  }
  expect(
    (await request("/services", "POST", { ...input, unit: "WEEK" })).status,
  ).toBe(422);
  const created = await request("/services", "POST", input);
  expect(created.status).toBe(201);
  const service = (await created.json()).data;
  expect(service.equipmentIds).toEqual(input.equipmentIds);
  expect(
    (
      await request(
        "/services/" + service.id,
        "PATCH",
        { defaultRatePaise: 190000 },
        cookieB,
      )
    ).status,
  ).toBe(404);
  const frozen = structuredClone(service);
  expect(
    (
      await request("/services/" + service.id, "PATCH", {
        defaultRatePaise: 190000,
      })
    ).status,
  ).toBe(200);
  let stored = await ServiceModel.findById(service.id).lean();
  expect(stored?.rateHistory).toHaveLength(1);
  expect(stored?.rateHistory[0].defaultRatePaise).toBe(170000);
  expect(frozen.defaultRatePaise).toBe(170000);
  await Promise.all([
    request("/services/" + service.id, "PATCH", { defaultRatePaise: 200000 }),
    request("/services/" + service.id, "PATCH", { defaultRatePaise: 210000 }),
  ]);
  stored = await ServiceModel.findById(service.id).lean();
  expect(stored?.rateHistory).toHaveLength(3);
  expect(
    stored?.rateHistory.every((entry) => entry.changedAt && entry.actorId),
  ).toBe(true);
  expect(
    (await request("/services/" + service.id, "PATCH", { active: false }))
      .status,
  ).toBe(200);
  expect((await (await request("/services")).json()).data.total).toBe(0);
  expect(
    (await (await request("/services?active=false")).json()).data.items[0].id,
  ).toBe(service.id);
  expect(
    (await request("/equipment/" + tractor.id, "PATCH", { active: false }))
      .status,
  ).toBe(200);
  expect(await EquipmentModel.countDocuments()).toBe(3);
  expect(
    (await ServiceModel.findById(service.id).lean())?.equipmentIds,
  ).toHaveLength(2);
  expect(
    (await request("/services/" + service.id, "PATCH", { active: true }))
      .status,
  ).toBe(200);
  expect(
    (await (await request("/services", "GET", undefined, cookieB)).json()).data
      .total,
  ).toBe(0);
}, 30_000);
