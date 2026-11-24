import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests only: no network, no database (Prisma is mocked where needed).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.js"],
    restoreMocks: true,
  },
});
