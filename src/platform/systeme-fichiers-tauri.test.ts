import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import type { InvokeArgs } from "@tauri-apps/api/core";
import { ErreurSystemeFichiers } from "../core/fichiers/systeme-fichiers";
import { SystemeFichiersTauri } from "./systeme-fichiers-tauri";

const RACINE = "/projets/demo";

function intercepter(reponse: (commande: string, args?: InvokeArgs) => unknown) {
  const appels: { commande: string; args: InvokeArgs | undefined }[] = [];
  mockIPC((commande, args) => {
    appels.push({ commande, args });
    return reponse(commande, args);
  });
  return appels;
}

describe("SystemeFichiersTauri (commandes Rust fs_atomique)", () => {
  afterEach(() => {
    clearMocks();
  });

  it("test_ac_005_3_ecriture_transmise_en_une_seule_commande", async () => {
    const appels = intercepter(() => null);
    const fichiers = [
      { chemin: ".cadre/cadre.yaml", contenu: "schema_version: 1\n" },
      { chemin: ".gitignore", contenu: ".cadre/tmp/\n" },
    ];

    await new SystemeFichiersTauri().ecrireTransaction(RACINE, fichiers);

    expect(appels).toEqual([
      { commande: "ecrire_fichiers_projet", args: { racine: RACINE, fichiers } },
    ]);
  });

  it("test_ac_005_4_recuperation_transmise", async () => {
    const appels = intercepter(() => null);

    await new SystemeFichiersTauri().recupererEcritures(RACINE);

    expect(appels).toEqual([{ commande: "recuperer_ecritures_projet", args: { racine: RACINE } }]);
  });

  it("test_ac_005_2_lecture_et_existence_transmises", async () => {
    const appels = intercepter((commande) =>
      commande === "lire_fichier_projet" ? "dist\n" : true,
    );
    const fs = new SystemeFichiersTauri();

    expect(await fs.lireTexte(RACINE, ".gitignore")).toBe("dist\n");
    expect(await fs.existe(RACINE, ".git")).toBe(true);
    expect(appels).toEqual([
      { commande: "lire_fichier_projet", args: { racine: RACINE, chemin: ".gitignore" } },
      { commande: "chemin_projet_existe", args: { racine: RACINE, chemin: ".git" } },
    ]);
  });

  it("test_ac_005_6_erreur_rust_convertie_en_erreur_typee", async () => {
    intercepter(() => {
      throw { code: "DISQUE_PLEIN", detail: "No space left on device (os error 28)" };
    });

    const promesse = new SystemeFichiersTauri().ecrireTransaction(RACINE, []);

    await expect(promesse).rejects.toEqual(
      new ErreurSystemeFichiers("DISQUE_PLEIN", "No space left on device (os error 28)"),
    );
    await expect(promesse).rejects.toBeInstanceOf(ErreurSystemeFichiers);
  });

  it("test_ac_005_6_erreur_inconnue_convertie_en_echec", async () => {
    intercepter(() => {
      throw "commande inconnue";
    });

    await expect(new SystemeFichiersTauri().lireTexte(RACINE, "x")).rejects.toMatchObject({
      code: "ECHEC",
      detail: "commande inconnue",
    });
  });
});
