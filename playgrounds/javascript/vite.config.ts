import { env, loadEnvFile } from "node:process";
import { defineConfig } from "vite";

loadEnvFile("../../.env");
const { PORT, MASTER_KEY } = env;

export default defineConfig({
  server: { host: "127.0.0.1" },
  define: Object.fromEntries(
    Object.entries({ PORT, MASTER_KEY }).map(([key, val]) => [
      `__${key}__`,
      JSON.stringify(val),
    ]),
  ),
});
