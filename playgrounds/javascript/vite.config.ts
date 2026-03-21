import { env, loadEnvFile } from "node:process";
import { defineConfig } from "vite";

loadEnvFile(new URL("../../.conf", import.meta.url));
const { MASTER_KEY, PORT } = env;
if (MASTER_KEY === undefined || PORT === undefined) {
  throw new Error("MASTER_KEY and/or PORT environment variables missing", {
    cause: { MASTER_KEY, PORT },
  });
}

export default defineConfig({
  server: { host: "127.0.0.1" },
  define: Object.fromEntries(
    Object.entries({ PORT, MASTER_KEY }).map(([key, val]) => [
      `__${key}__`,
      JSON.stringify(val),
    ]),
  ),
});
