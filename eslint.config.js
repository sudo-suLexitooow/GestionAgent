import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import vitest from "@vitest/eslint-plugin";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src-tauri/target", "src-tauri/gen"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // Interdit les tests focalisés ou désactivés (règle TDD n°4) ; doublé par `npm run check:tdd`.
    files: ["src/**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      // Formes conditionnelles ou en attente que le plugin ne couvre pas.
      "no-restricted-properties": [
        "error",
        ...["it", "test", "describe"].flatMap((object) =>
          ["skipIf", "runIf", "todo"].map((property) => ({ object, property })),
        ),
      ],
    },
  },
  { files: ["**/*.js", "**/*.mjs"], ...tseslint.configs.disableTypeChecked },
);
