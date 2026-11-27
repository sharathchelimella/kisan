import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwind()],
    server: {
      proxy: { "/api": env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000" },
    },
  };
});
