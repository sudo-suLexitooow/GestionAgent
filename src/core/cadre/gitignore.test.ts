import { completerGitignore, LIGNES_GITIGNORE_CADRE } from "./gitignore";

describe(".gitignore racine (AC-005-2)", () => {
  it("test_ac_005_2_lignes_attendues_runs_backups_tmp", () => {
    expect(LIGNES_GITIGNORE_CADRE).toEqual([".cadre/runs/", ".cadre/backups/", ".cadre/tmp/"]);
  });

  it("test_ac_005_2_gitignore_absent_est_cree_avec_les_trois_lignes", () => {
    expect(completerGitignore(null)).toBe(".cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n");
  });

  it("test_ac_005_2_lignes_ajoutees_a_la_fin_sans_modifier_les_autres", () => {
    const existant = "# dépendances\nnode_modules\n\ndist\n";

    expect(completerGitignore(existant)).toBe(
      existant + ".cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n",
    );
  });

  it("test_ac_005_2_derniere_ligne_sans_fin_de_ligne_reste_intacte", () => {
    expect(completerGitignore("node_modules")).toBe(
      "node_modules\n.cadre/runs/\n.cadre/backups/\n.cadre/tmp/\n",
    );
  });

  it("test_ac_005_2_fichier_crlf_complete_en_crlf", () => {
    expect(completerGitignore("dist\r\n")).toBe(
      "dist\r\n.cadre/runs/\r\n.cadre/backups/\r\n.cadre/tmp/\r\n",
    );
  });

  it("test_ac_005_2_ligne_deja_presente_non_dupliquee", () => {
    const existant = "dist\n.cadre/runs/\r\nbuild\n.cadre/tmp/   \n";

    expect(completerGitignore(existant)).toBe(existant + ".cadre/backups/\n");
  });

  it("test_ac_005_2_toutes_les_lignes_presentes_aucune_ecriture", () => {
    expect(completerGitignore(".cadre/tmp/\n.cadre/runs/\n.cadre/backups/")).toBeNull();
  });
});
