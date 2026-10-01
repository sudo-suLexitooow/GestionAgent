import { CODES_ERREUR_FICHIERS } from "../../core/fichiers/systeme-fichiers";
import { t, type LabelKey } from "./index";

// Libellés d'AC-005-6 déplacés du cœur vers l'interface (US-077), texte inchangé.
const RASSURANCE = "Vos fichiers n'ont pas été modifiés.";

describe("libellés des erreurs d'enregistrement (AC-005-6, AC-077-2)", () => {
  test.each([
    [
      "LECTURE_SEULE",
      `Enregistrement impossible : le dossier du projet est en lecture seule ou son accès est refusé. ${RASSURANCE}`,
    ],
    [
      "DISQUE_PLEIN",
      `Enregistrement impossible : le disque est plein. Libérez de l'espace puis réessayez. ${RASSURANCE}`,
    ],
    [
      "CHEMIN_INVALIDE",
      `Enregistrement impossible : un chemin de fichier est invalide ou passe par un lien symbolique (par exemple un .gitignore lié à un autre fichier). ${RASSURANCE}`,
    ],
    [
      "PROJET_OCCUPE",
      "Le projet est en cours d'enregistrement par une autre fenêtre de Cadre. Réessayez.",
    ],
    [
      "ANNULATION_INCOMPLETE",
      "L'enregistrement a échoué et n'a pas pu être entièrement annulé ; Cadre terminera l'annulation à la prochaine opération.",
    ],
    [
      "RECUPERATION_IMPOSSIBLE",
      "Enregistrement impossible : une écriture interrompue n'a pas pu être reprise. Des fichiers du projet peuvent être partiellement modifiés ; les copies d'origine sont dans le dossier indiqué dans le détail, rien n'a été supprimé. Réessayez pour enregistrer.",
    ],
    ["ECHEC", `Enregistrement impossible à cause d'une erreur inattendue. ${RASSURANCE}`],
  ])("test_ac_077_2_libelle_de_l_erreur_%s_inchange", (code, libelle) => {
    expect(t(`save.error.${code}` as LabelKey)).toBe(libelle);
  });

  test("test_ac_077_2_chaque_code_d_erreur_du_systeme_a_un_libelle", () => {
    for (const code of CODES_ERREUR_FICHIERS) {
      expect(t(`save.error.${code}`)).toEqual(expect.any(String));
    }
  });
});
