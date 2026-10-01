// Faux système de fichiers en mémoire, pour tester le cœur sans disque. Reproduit le
// contrat du port : écriture tout ou rien, erreurs typées.
import {
  ErreurSystemeFichiers,
  type CodeErreurFichiers,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";

export class SystemeFichiersMemoire implements SystemeFichiersProjet {
  private readonly contenus: Map<string, string>;
  private echecEcriture: CodeErreurFichiers | null = null;
  private echecLecture: CodeErreurFichiers | null = null;
  /** Lots passés à `ecrireTransaction`, réussis ou non. */
  readonly transactions: FichierAEcrire[][] = [];

  constructor(fichiers: Record<string, string> = {}) {
    this.contenus = new Map(Object.entries(fichiers));
  }

  /** La prochaine écriture échoue avec ce code, sans rien modifier. */
  echouerProchaineEcriture(code: CodeErreurFichiers): void {
    this.echecEcriture = code;
  }

  /** La prochaine lecture échoue avec ce code. */
  echouerProchaineLecture(code: CodeErreurFichiers): void {
    this.echecLecture = code;
  }

  contenu(chemin: string): string | undefined {
    return this.contenus.get(chemin);
  }

  instantane(): Record<string, string> {
    return Object.fromEntries(this.contenus);
  }

  lireTexte(_racine: string, chemin: string): Promise<string | null> {
    const echec = this.echecLecture;
    if (echec) {
      this.echecLecture = null;
      return Promise.reject(new ErreurSystemeFichiers(echec, `lecture simulée de ${chemin}`));
    }
    return Promise.resolve(this.contenus.get(chemin) ?? null);
  }

  existe(_racine: string, chemin: string): Promise<boolean> {
    const prefixe = `${chemin}/`;
    return Promise.resolve(
      this.contenus.has(chemin) || [...this.contenus.keys()].some((c) => c.startsWith(prefixe)),
    );
  }

  ecrireTransaction(_racine: string, fichiers: FichierAEcrire[]): Promise<void> {
    this.transactions.push(fichiers.map((fichier) => ({ ...fichier })));
    const echec = this.echecEcriture;
    if (echec) {
      this.echecEcriture = null;
      return Promise.reject(new ErreurSystemeFichiers(echec, "écriture simulée"));
    }
    for (const fichier of fichiers) this.contenus.set(fichier.chemin, fichier.contenu);
    return Promise.resolve();
  }

  /** En mémoire, une écriture n'est jamais interrompue : rien à récupérer. */
  recupererEcritures(): Promise<void> {
    return Promise.resolve();
  }
}
