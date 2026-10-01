// Version de Cadre, remplacée à la compilation par celle de package.json (`define` de
// vite.config.ts) ; inscrite dans `generator_version` de `cadre.yaml` (ADR-001, D8).
declare const __CADRE_VERSION__: string;

export const VERSION_CADRE: string = __CADRE_VERSION__;
