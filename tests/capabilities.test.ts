import { readFileSync } from "node:fs";
import { join } from "node:path";

// Les capacités Tauri bornent ce que l'interface peut demander au système.
const capabilities = JSON.parse(
  readFileSync(join(import.meta.dirname, "../src-tauri/capabilities/default.json"), "utf8"),
) as { permissions: string[] };

describe("capacités de la fenêtre principale", () => {
  test("test_ac_001_1_le_selecteur_de_dossier_est_autorise", () => {
    expect(capabilities.permissions).toContain("dialog:allow-open");
  });

  test("test_ac_001_6_aucune_permission_reseau_ni_au_dela_du_strict_necessaire", () => {
    expect([...capabilities.permissions].sort()).toEqual(["core:default", "dialog:allow-open"]);
  });
});
