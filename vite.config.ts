/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri attend un port fixe et ne doit pas masquer les erreurs Rust.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host ?? false,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Cœur : modèle, adaptateurs, validation, diff (NF-18).
      include: ["src/core/**/*.{ts,tsx}"],
      exclude: ["src/core/**/*.test.{ts,tsx}"],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70, perFile: true },
    },
  },
});
