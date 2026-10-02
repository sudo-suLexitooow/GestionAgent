import { CODES_ERREUR_EXPORT } from "../../core/export/exporter";
import { t, type LabelKey } from "./index";

/** Échecs survenus pendant l'écriture : des fichiers peuvent avoir été touchés, le dire serait faux. */
const ECRITURE_PEUT_ETRE_PARTIELLE: ReadonlySet<string> = new Set([
  "ANNULATION_INCOMPLETE",
  "RECUPERATION_IMPOSSIBLE",
]);

describe("libellés des refus d'export (AC-008-3, AC-008-4)", () => {
  test.each(CODES_ERREUR_EXPORT.filter((code) => !ECRITURE_PEUT_ETRE_PARTIELLE.has(code)))(
    "test_ac_008_4_le_refus_%s_dit_que_rien_n_a_ete_ecrit",
    (code) => {
      expect(t(`export.error.${code}` as LabelKey)).toContain("Rien n'a été écrit.");
    },
  );

  test.each([...ECRITURE_PEUT_ETRE_PARTIELLE])(
    "test_ac_008_3_l_erreur_%s_a_un_libelle_qui_ne_pretend_pas_que_rien_n_a_ete_ecrit",
    (code) => {
      const libelle = t(`export.error.${code}` as LabelKey);
      expect(libelle).toEqual(expect.any(String));
      expect(libelle).not.toContain("Rien n'a été écrit.");
    },
  );
});
