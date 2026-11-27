import { once } from "node:events";
import type { Server } from "node:http";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createMemoryFarmerRepository } from "@kisan/contracts/farmer-memory";
import { createApp } from "../app";
import { createAuthService } from "../services/auth.service";
import { memoryAuth } from "./memory-auth";
import { farmerSchema, type Session } from "@kisan/contracts";

const users = memoryAuth();
const farmers = createMemoryFarmerRepository();
const auth = createAuthService(users);
let server: Server;
let url: string;
let cookieA: string;
let cookieB: string;
beforeAll(async () => {
  const createOwner = (email: string) =>
    users.createOwner({
      email,
      passwordHash: "unused",
      businessName: "DEMO",
      displayName: "DEMO",
      village: "DEMO",
      preferredLanguage: "en",
    });
  const a = (await createOwner("a@example.test")) as Session;
  const b = (await createOwner("b@example.test")) as Session;
  cookieA = "kisan_session=" + (await auth.start(a));
  cookieB = "kisan_session=" + (await auth.start(b));
  server = createApp({ auth, farmers }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TCP required");
  url = `http://127.0.0.1:${address.port}/api/v1/farmers`;
});
afterAll(async () => {
  if (server?.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});
function request(path = "", method = "GET", body?: object, cookie = cookieA) {
  return fetch(url + path, {
    method,
    headers: {
      cookie,
      "X-Kisan-Request": "1",
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });
}

it("creates without a phone, searches normalized text and paginates within the business", async () => {
  expect((await request("", "GET", undefined, "")).status).toBe(401);
  expect(
    (
      await request("", "POST", {
        name: "DEMO",
        village: "DEMO",
        businessId: "forged",
      })
    ).status,
  ).toBe(422);
  const response = await request("", "POST", {
    name: "DEMO   Farmer",
    village: "North Village",
  });
  expect(response.status).toBe(201);
  const farmer = farmerSchema.parse((await response.json()).data);
  expect(farmer.mobile).toBeUndefined();
  await request("", "POST", {
    name: "DEMO Other",
    village: "South",
    mobile: "98765 43210",
  });
  for (const q of ["demo farmer", " NORTH   village "]) {
    const result = await request("?q=" + encodeURIComponent(q));
    expect(
      (await result.json()).data.items.map((item: { id: string }) => item.id),
    ).toContain(farmer.id);
  }
  expect((await (await request("?q=98765-43210")).json()).data.total).toBe(1);
  expect(
    (await (await request("?village=NORTH%20%20VILLAGE")).json()).data.total,
  ).toBe(1);
  expect(
    (await (await request("?pageSize=1&page=2")).json()).data.items,
  ).toHaveLength(1);
  expect((await request("?pageSize=101")).status).toBe(422);
  expect(
    (await (await request("", "GET", undefined, cookieB)).json()).data.total,
  ).toBe(0);
  expect(
    (await request("/" + farmer.id, "GET", undefined, cookieB)).status,
  ).toBe(404);
  expect(
    (await request("/" + farmer.id, "PATCH", { name: "forged" }, cookieB))
      .status,
  ).toBe(404);
  expect(
    (await request("/" + farmer.id + "/archive", "POST", {}, cookieB)).status,
  ).toBe(404);
  const matches = await request("/duplicates", "POST", {
    name: "demo farmer",
    village: "north village",
  });
  expect((await matches.json()).data[0].id).toBe(farmer.id);
  expect(
    (
      await (
        await request(
          "/duplicates",
          "POST",
          { name: "demo farmer", village: "north village" },
          cookieB,
        )
      ).json()
    ).data,
  ).toEqual([]);
  expect(
    (
      await request("/" + farmer.id, "PATCH", {
        notes: "DEMO updated",
        mobile: "",
      })
    ).status,
  ).toBe(200);
  const archived = farmerSchema.parse(
    (await (await request("/" + farmer.id + "/archive", "POST", {})).json())
      .data,
  );
  expect(archived.archivedAt).toBeTruthy();
  expect(
    (await (await request("/" + farmer.id + "/archive", "POST", {})).json())
      .data.archivedAt,
  ).toBe(archived.archivedAt);
  expect(
    (await request("/" + farmer.id, "PATCH", { name: "changed" })).status,
  ).toBe(404);
  expect((await request("/" + farmer.id)).status).toBe(200);
  expect(
    (await (await request("?archived=true")).json()).data.items[0].id,
  ).toBe(farmer.id);
  expect((await (await request("?q=demo%20farmer")).json()).data.total).toBe(0);
});
it("requires CSRF header for writes and escapes search patterns", async () => {
  expect(
    (
      await fetch(url, {
        method: "POST",
        headers: { cookie: cookieA, "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
  ).toBe(403);
  expect((await (await request("?q=%5B.*")).json()).data.total).toBe(0);
  expect((await request("/not-a-valid-id")).status).toBe(404);
});
