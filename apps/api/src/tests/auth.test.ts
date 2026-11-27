import { once } from "node:events";
import type { Server } from "node:http";
import { afterAll, beforeAll, expect, it } from "vitest";
import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  sessionSchema,
} from "@kisan/contracts";
import { createApp } from "../app";
import { requireSession } from "../middleware/auth";
import { issueRegistrationCode, sessionDigest } from "../services/auth.crypto";
import { createAuthService } from "../services/auth.service";
import { memoryAuth } from "./memory-auth";

const secret = "DEMO-registration-secret-for-tests-only";
const password = "DEMO-strong-password!";
const repo = memoryAuth();
const auth = createAuthService(repo, secret);
let server: Server;
let url: string;

beforeAll(async () => {
  const app = createApp({ auth, secureCookies: true });

  // Simulates a future feature retrieving a record scoped to the server-resolved business ID.
  const express = (await import("express")).default;
  const root = express();
  root.get("/tenant/:id", requireSession(auth), (req, res) => {
    res.sendStatus(req.params.id === res.locals.businessId ? 200 : 404);
  });
  root.use(app);

  server = root.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Expected TCP address");
  url = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server?.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

function post(
  path: string,
  body: object,
  headers: Record<string, string> = {},
) {
  return fetch(`${url}${API_PREFIX}/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [AUTH_REQUEST_HEADER]: "1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function registration(
  email: string,
  expires = Math.floor(Date.now() / 1000) + 120,
) {
  return {
    email,
    password,
    displayName: "DEMO Owner",
    businessName: "DEMO Farm",
    village: "DEMO Village",
    preferredLanguage: "en",
    verificationCode: issueRegistrationCode(email, secret, expires),
  };
}

it("creates verified owners, rejects replay and isolates authenticated business sessions", async () => {
  const ownerA = registration("demo-a@example.test");
  const ownerB = registration("demo-b@example.test");
  expect((await post("register", ownerA)).status).toBe(201);
  expect((await post("register", ownerB)).status).toBe(201);
  expect((await post("register", ownerA)).status).toBe(400);
  expect(
    (await post("register", { ...ownerB, email: "demo-c@example.test" }))
      .status,
  ).toBe(400);
  expect(
    (await post("register", registration("demo-c@example.test", 1700000000)))
      .status,
  ).toBe(400);
  const saved = await repo.findCredentials(ownerA.email);
  expect(saved?.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  const me = `${url}${API_PREFIX}/auth/me`;
  expect((await fetch(me)).status).toBe(401);
  const bad = await post("login", { email: ownerA.email, password: "wrong" });
  const unknown = await post("login", {
    email: "unknown@example.test",
    password: "wrong",
  });
  expect(bad.status).toBe(401);
  expect(unknown.status).toBe(401);
  expect((await bad.json()).error).toEqual((await unknown.json()).error);

  const signedIn = await post("login", {
    email: ownerA.email.toUpperCase(),
    password,
  });
  expect(signedIn.status).toBe(200);
  const raw = signedIn.headers.get("set-cookie")!;
  expect(raw).toMatch(/HttpOnly/i);
  expect(raw).toMatch(/Secure/i);
  expect(raw).toMatch(/SameSite=Lax/i);
  const cookie = raw.split(";")[0];
  const body = await signedIn.json();
  expect(JSON.stringify(body)).not.toContain("password");
  const session = sessionSchema.parse(body.data);
  const profile = await fetch(me, { headers: { cookie } });
  expect(profile.status).toBe(200);
  expect(profile.headers.get("cache-control")).toBe("no-store");
  expect((await profile.json()).data).toEqual(session);
  expect(
    (
      await fetch(`${url}/tenant/${session.business.id}`, {
        headers: { cookie },
      })
    ).status,
  ).toBe(200);
  const businessB = (await repo.findCredentials(ownerB.email))!.businessId;
  expect(
    (
      await fetch(`${url}/tenant/${businessB}`, {
        headers: { cookie, "X-Business-Id": businessB },
      })
    ).status,
  ).toBe(404);

  const forged = "f".repeat(64);
  await repo.saveSession(
    sessionDigest(forged),
    { userId: session.owner.id, businessId: businessB },
    new Date(Date.now() + 60_000),
  );
  expect(
    (await fetch(me, { headers: { cookie: `kisan_session=${forged}` } }))
      .status,
  ).toBe(401);
  const expired = "a".repeat(64);
  await repo.saveSession(
    sessionDigest(expired),
    { userId: session.owner.id, businessId: session.business.id },
    new Date(0),
  );
  expect(
    (await fetch(me, { headers: { cookie: `kisan_session=${expired}` } }))
      .status,
  ).toBe(401);

  expect(
    (await post("logout", {}, { cookie, [AUTH_REQUEST_HEADER]: "" })).status,
  ).toBe(403);
  expect(
    (await post("logout", {}, { cookie, "Sec-Fetch-Site": "cross-site" }))
      .status,
  ).toBe(403);
  expect((await post("logout", {}, { cookie })).status).toBe(200);
  expect((await fetch(me, { headers: { cookie } })).status).toBe(401);
}, 15_000);

it("responds generically to recovery and throttles repeated requests", async () => {
  const known = await post("forgot-password", { email: "demo-a@example.test" });
  const unknown = await post("forgot-password", {
    email: "unknown@example.test",
  });
  expect(known.status).toBe(202);
  expect(unknown.status).toBe(202);
  expect((await known.json()).data).toEqual((await unknown.json()).data);
  for (let attempt = 0; attempt < 8; attempt += 1)
    await post("forgot-password", { email: "demo-a@example.test" });
  const limited = await post("forgot-password", {
    email: "demo-a@example.test",
  });
  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBeTruthy();
});
