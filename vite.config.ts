/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import tsconfig from "./tsconfig.json" with { type: "json" };

export default defineConfig({
  build: {
    sourcemap: true,
    target: tsconfig.compilerOptions.target,
    lib: {
      entry: ["src/index.ts", "src/token.ts"],
      formats: ["es"],
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 100_000, // 100 seconds
    coverage: { include: ["src/**/*.ts"] },
    // Allow loading env variables from `.env.test`
    env: loadEnv("test", process.cwd()),
  },
});
