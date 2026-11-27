import { once } from "node:events";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { apiErrorSchema, healthSchema } from "@kisan/contracts";
import { createApp } from "../app";
import { readEnv } from "../config/env";

let server: Server;
let url: string;

beforeAll(async () => {
  server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Expected a TCP address");
  url = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server?.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

describe("foundation API", () => {
  it("returns liveness and a matching request ID", async () => {
    const response = await fetch(`${url}/api/v1/health`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(healthSchema.parse(body.data)).toEqual({ status: "ok" });
    expect(body.meta.requestId).toBe(response.headers.get("x-request-id"));
    expect(body.meta.requestId).toBeTruthy();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("reports database readiness separately from liveness", async () => {
    const response = await fetch(`${url}/api/v1/ready`);
    expect(response.status).toBe(503);
    const body = apiErrorSchema.parse(await response.json());
    expect(body.error.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("sets transport policy when secure cookies are enabled", async () => {
    const secureServer = createApp({ secureCookies: true }).listen(
      0,
      "127.0.0.1",
    );
    await once(secureServer, "listening");
    try {
      const address = secureServer.address();
      if (!address || typeof address === "string")
        throw new Error("Expected TCP address");
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/health`,
      );
      expect(response.headers.get("strict-transport-security")).toBe(
        "max-age=31536000; includeSubDomains",
      );
    } finally {
      await new Promise<void>((resolve) => secureServer.close(() => resolve()));
    }
  });

  it("returns the documented error envelope for missing routes", async () => {
    const response = await fetch(`${url}/api/v1/missing`);
    expect(response.status).toBe(404);
    const body = apiErrorSchema.parse(await response.json());
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("validates local and production environment values", () => {
    expect(readEnv({}).PORT).toBe(3000);
    expect(
      readEnv({ PORT: "3100", MONGODB_URI: "mongodb://localhost/kisan" }).PORT,
    ).toBe(3100);
    expect(() => readEnv({ PORT: "65536" })).toThrow();
    expect(() => readEnv({ MONGODB_URI: "http://localhost" })).toThrow();
    expect(() => readEnv({ NODE_ENV: "production" })).toThrow();
    expect(() =>
      readEnv({
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://localhost/kisan",
      }),
    ).toThrow();
    expect(
      readEnv({
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://localhost/kisan",
        AUTH_REGISTRATION_SECRET: "a".repeat(32),
      }).NODE_ENV,
    ).toBe("production");
  });
});
