import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "coverage", "src-tauri/target", "src-tauri/gen"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Interdit les tests focalisés ou sautés (règle TDD n°4) : vérifié aussi en CI.
      "no-restricted-properties": [
        "error",
        { object: "it", property: "only" },
        { object: "it", property: "skip" },
        { object: "test", property: "only" },
        { object: "test", property: "skip" },
        { object: "describe", property: "only" },
        { object: "describe", property: "skip" },
      ],
    },
  },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
);
