// Faux disque en mémoire qui sert les deux ports du projet : la lecture (`ProjectFiles`) et
// l'écriture transactionnelle (`SystemeFichiersProjet`, US-005). Une écriture est visible des
// lectures suivantes, comme sur le vrai disque ; elle est tout ou rien.
import {
  ErreurSystemeFichiers,
  type CodeErreurFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";
import { InMemoryProjectFiles } from "./in-memory-project-files";

export class DisqueMemoire extends InMemoryProjectFiles implements SystemeFichiersProjet {
  /** Lots passés à `ecrireTransaction`, réussis ou non. */
  readonly transactions: FichierAEcrire[][] = [];
  private echecEcriture: CodeErreurFichiers | null = null;
  /** Appelé au début de chaque transaction, avant toute écriture (p. ex. pour la suspendre). */
  avantEcriture: () => Promise<void> = () => Promise.resolve();

  /** La prochaine transaction échoue avec ce code, sans rien écrire (erreur au milieu, rollback). */
  echouerProchaineEcriture(code: CodeErreurFichiers): this {
    this.echecEcriture = code;
    return this;
  }

  /** Modification faite hors de Cadre (par l'utilisateur, un éditeur, Git…). */
  modifierHorsCadre(chemin: string, contenu: string | Uint8Array): void {
    this.deposer(chemin, contenu);
  }

  /** Suppression faite hors de Cadre. */
  supprimerHorsCadre(chemin: string): void {
    this.files.delete(chemin);
  }

  /** Octets actuels de `chemin`, `undefined` s'il est absent. */
  octets(chemin: string): Uint8Array | undefined {
    return this.files.get(chemin);
  }

  /** Chemins des fichiers présents, triés. */
  chemins(): string[] {
    return [...this.files.keys()].sort();
  }

  lireTexte(racine: string, chemin: string): Promise<string | null> {
    return this.readFile(racine, chemin).then((octets) =>
      octets === null ? null : new TextDecoder().decode(octets),
    );
  }

  estDansUnDepotGit(): Promise<boolean> {
    return Promise.resolve(this.chemins().some((c) => c === ".git" || c.startsWith(".git/")));
  }

  async ecrireTransaction(_racine: string, fichiers: FichierAEcrire[]): Promise<void> {
    this.transactions.push(fichiers.map((fichier) => ({ ...fichier })));
    await this.avantEcriture();
    const echec = this.echecEcriture;
    if (echec) {
      this.echecEcriture = null;
      throw new ErreurSystemeFichiers(echec, "écriture simulée");
    }
    for (const { chemin, contenu } of fichiers) this.deposer(chemin, contenu);
  }

  private deposer(chemin: string, contenu: string | Uint8Array): void {
    this.addDirectoryAndParents(chemin.split("/").slice(0, -1));
    this.files.set(
      chemin,
      typeof contenu === "string" ? new TextEncoder().encode(contenu) : contenu.slice(),
    );
  }
}
