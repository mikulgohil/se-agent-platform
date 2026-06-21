import { defineConfig } from "vitest/config";
import path from "node:path";

// The engine is framework-free (pure functions over plain data), so tests run
// in a plain Node environment — fast, no jsdom needed.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
