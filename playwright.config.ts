import { defineConfig } from "@playwright/test";

export default defineConfig({
  workers: 2,
  testDir: "./apps/web/src/tests",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:5174",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: [
    {
      command: "npm exec -w @kisan/api -- tsx src/tests/auth-test-server.ts",
      url: "http://127.0.0.1:3101/api/v1/health",
      env: { NODE_ENV: "test" },
    },
    {
      command:
        "npm run dev -w @kisan/web -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: {
        VITE_API_PROXY_TARGET: "http://127.0.0.1:3101",
        VITE_USE_MOCK_API: process.env.VITE_USE_MOCK_API || "false",
      },
    },
  ],
});
