import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: mixing this project's rolldown-vite
// plugin types with vitest's own bundled Vite types under `tsc -b` produces
// unrelated-looking type errors. Vitest still picks up vite.config.ts's
// plugins/build settings automatically and only takes `test` from here.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  },
});
