import { expect, test } from "@playwright/test";

test("proxies the live API health endpoint through the dev server", async ({
  request,
}) => {
  const response = await request.get("/api/v1/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    data: { status: "ok" },
    meta: { requestId: response.headers()["x-request-id"] },
  });
});
