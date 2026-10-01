import type { ContextFileSpec } from "./context";

/**
 * Fichiers de contexte du format générique, communs à plusieurs outils. AGENTS.md est importé en
 * lecture seule au MVP 0 : son export relève de l'adaptateur générique (US-055, Q-04).
 */
export const GENERIC_CONTEXT_FILES: readonly ContextFileSpec[] = [
  { file: "AGENTS.md", name: "AGENTS", type: "autre", readonly: true },
];
