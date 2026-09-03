import { defineConfig } from "vitest/config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default defineConfig({
  resolve: {
    alias: {
      "node:sqlite": require.resolve("./tests/_helpers/sqlite-shim.mjs"),
    },
  },
  test: {
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
