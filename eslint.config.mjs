import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // server.js is a plain CommonJS Node entry point (run directly / by
    // Passenger), so `require` is expected there.
    files: ["server.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      // This newly-added rule flags idiomatic, non-buggy patterns we rely on:
      // client-only mount guards (portals / next-themes hydration), reading
      // localStorage after mount, and syncing derived state when props change.
      // Keep it visible as a warning rather than a hard error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
