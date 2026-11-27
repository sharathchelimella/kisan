import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, it, expect } from "vitest";
import { mongoFarmers } from "../services/farmer.repository";
import { FarmerModel } from "../models/Farmer.model";

let server: MongoMemoryServer;
beforeAll(async () => {
  server = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
  });
  await mongoose.connect(server.getUri());
  await FarmerModel.createIndexes();
}, 120_000);
afterAll(async () => {
  await mongoose.disconnect();
  await server?.stop();
});
it("uses tenant-scoped Mongo queries for search, duplicates, updates and archive", async () => {
  const a = new Types.ObjectId().toHexString();
  const b = new Types.ObjectId().toHexString();
  const first = await mongoFarmers.create(a, {
    name: "DEMO   Farmer",
    village: "North Village",
    mobile: "98765 43210",
  });
  const second = await mongoFarmers.create(b, {
    name: "DEMO Farmer",
    village: "North Village",
    mobile: "98765 43210",
  });
  const query = { page: 1, pageSize: 20, archived: "false" as const };
  expect(
    (await mongoFarmers.list(a, { ...query, q: "demo farmer" })).items.map(
      (item) => item.id,
    ),
  ).toEqual([first.id]);
  expect(
    (await mongoFarmers.list(a, { ...query, q: "98765-43210" })).total,
  ).toBe(1);
  expect((await mongoFarmers.list(a, { ...query, q: "[.*" })).total).toBe(0);
  expect(
    (await mongoFarmers.list(a, { ...query, village: " NORTH   Village " }))
      .total,
  ).toBe(1);
  expect(await mongoFarmers.get(a, second.id)).toBeNull();
  expect(
    await mongoFarmers.update(a, second.id, { name: "forged" }),
  ).toBeNull();
  expect(await mongoFarmers.archive(a, second.id)).toBeNull();
  expect(
    (
      await mongoFarmers.matches(a, {
        name: "demo farmer",
        village: "north village",
      })
    ).map((item) => item.id),
  ).toEqual([first.id]);
  expect(
    (await mongoFarmers.update(a, first.id, { name: "DEMO New", mobile: "" }))
      ?.name,
  ).toBe("DEMO New");
  expect((await mongoFarmers.list(a, { ...query, q: "demo new" })).total).toBe(
    1,
  );
  const [archived, retried] = await Promise.all([
    mongoFarmers.archive(a, first.id),
    mongoFarmers.archive(a, first.id),
  ]);
  expect(archived?.archivedAt).toBeTruthy();
  expect(retried?.archivedAt).toBe(archived?.archivedAt);
  expect(await mongoFarmers.update(a, first.id, { name: "no" })).toBeNull();
  expect(await FarmerModel.countDocuments({ businessId: a })).toBe(1);
  expect((await mongoFarmers.list(a, query)).total).toBe(0);
  expect(
    (await mongoFarmers.list(a, { ...query, archived: "true" })).total,
  ).toBe(1);
});
