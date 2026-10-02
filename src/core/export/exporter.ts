// Export du modèle `.cadre/` vers un outil (US-008) : le cœur ne connaît que le port d'export
// (ADP-01, NF-19). Une seule transaction, via le chemin d'écriture d'US-005 (NF-12).
import type { AdaptateurExport, AgentAExporter, FichierExporte } from "../adapters/adapter";
import { chargerModele, type AgentCharge } from "../cadre/charger-modele";
import { empreinte } from "../cadre/empreinte";
import {
  enregistrerFichiers,
  versErreurEnregistrement,
  type ErreurEnregistrement,
} from "../cadre/enregistrer";
import { serialiserManifeste } from "../cadre/generated-yaml";
import {
  CODES_ERREUR_FICHIERS,
  type FichierAEcrire,
  type SystemeFichiersProjet,
} from "../fichiers/systeme-fichiers";
import { readFailureReason, type ProjectFiles } from "../project/ports";
import { lireManifeste, mettreAJourManifeste, type EntreeManifeste } from "./manifeste";

/**
 * Codes d'erreur de l'export (libellés dans `src/ui/i18n/`) : ceux du système de fichiers, plus
 * les refus décidés avant toute écriture : `MODELE_NON_MODIFIABLE` (modèle absent, incomplet ou
 * d'un format plus récent), `MODELE_INVALIDE` (agent en erreur ou refusé par l'adaptateur),
 * `ECRASEMENT_A_CONFIRMER` (fichier existant non généré par Cadre, ou modifié depuis),
 * `FICHIER_LIEN`, `FICHIER_ILLISIBLE` (fichier existant que Cadre ne peut pas lire) et
 * `MANIFESTE_INVALIDE` (`.cadre/generated.yaml`).
 */
export const CODES_ERREUR_EXPORT = [
  ...CODES_ERREUR_FICHIERS,
  "MODELE_NON_MODIFIABLE",
  "MODELE_INVALIDE",
  "ECRASEMENT_A_CONFIRMER",
  "FICHIER_LIEN",
  "FICHIER_ILLISIBLE",
  "MANIFESTE_INVALIDE",
] as const;

export type CodeErreurExport = (typeof CODES_ERREUR_EXPORT)[number];

export interface ErreurExport {
  code: CodeErreurExport;
  detail: string;
}

/** Écrasement confirmé d'un fichier, pour le contenu d'empreinte `sha256` (CRLF → LF). */
export interface ConfirmationEcrasement {
  chemin: string;
  sha256: string;
}

/**
 * Empreinte actuelle de chaque fichier à confirmer, lue au moment d'afficher la confirmation :
 * la confirmation ne vaudra que pour ce contenu. Un fichier absent, illisible ou lié est omis
 * (l'export le signalera à nouveau). Ne rejette jamais.
 */
export async function empreintesActuelles(
  fichiers: ProjectFiles,
  racine: string,
  chemins: readonly string[],
): Promise<ConfirmationEcrasement[]> {
  const lus = await Promise.all(
    chemins.map(async (chemin) => {
      const octets = await fichiers.readFile(racine, chemin).catch(() => null);
      return octets === null ? [] : [{ chemin, sha256: await empreinte(octets) }];
    }),
  );
  return lus.flat();
}

export interface OptionsExport {
  /** Écrasements confirmés, chacun valable seulement pour le contenu vu par l'utilisateur. */
  confirmations?: readonly ConfirmationEcrasement[];
  /**
   * Écrasements confirmés par chemin seul, quel que soit le contenu actuel. Conservé pour les
   * tests de la première version ; l'interface utilise `confirmations`.
   */
  confirmes?: readonly string[];
}

export type ResultatExport =
  { ok: true; fichiers: string[] } | { ok: false; erreur: ErreurExport; aConfirmer?: string[] };

type Refus = { ok: false; erreur: ErreurExport; aConfirmer?: string[] };

const CADRE_YAML = ".cadre/cadre.yaml";
const MANIFESTE = ".cadre/generated.yaml";

/**
 * Exporte les agents du modèle dont `adaptateur` est la cible : `valider`, puis `exporter`, puis
 * écriture des fichiers produits et de leurs entrées dans le manifeste, tout ou rien. Refuse sans
 * rien écrire un modèle absent, incomplet, en lecture seule ou invalide, et tout fichier existant
 * qui n'est pas un fichier généré intact (ADR-001, D5) sauf confirmation explicite. Ne rejette
 * jamais.
 */
export async function exporterModele(
  disque: { fichiers: ProjectFiles; systeme: SystemeFichiersProjet },
  racine: string,
  adaptateur: AdaptateurExport,
  options: OptionsExport = {},
): Promise<ResultatExport> {
  let preparation: { lot: FichierAEcrire[]; fichiers: string[] } | Refus;
  try {
    preparation = await preparer(disque.fichiers, racine, adaptateur, options);
  } catch (erreur) {
    return { ok: false, erreur: enErreurExport(versErreurEnregistrement(erreur)) };
  }
  if ("erreur" in preparation) return preparation;
  const resultat = await enregistrerFichiers(disque.systeme, racine, preparation.lot);
  if (!resultat.ok) return { ok: false, erreur: enErreurExport(resultat.erreur) };
  return { ok: true, fichiers: preparation.fichiers };
}

/** Erreur du chemin d'écriture : seuls les codes du système de fichiers en sortent. */
function enErreurExport({ code, detail }: ErreurEnregistrement): ErreurExport {
  const connu = CODES_ERREUR_EXPORT.find((candidat) => candidat === code);
  return { code: connu ?? "ECHEC", detail };
}

async function preparer(
  fichiers: ProjectFiles,
  racine: string,
  adaptateur: AdaptateurExport,
  options: OptionsExport,
): Promise<{ lot: FichierAEcrire[]; fichiers: string[] } | Refus> {
  const chargement = await chargerModele(fichiers, racine);
  if (chargement.etat !== "charge" || chargement.lectureSeule) {
    return refus("MODELE_NON_MODIFIABLE", CADRE_YAML);
  }
  const enErreur = chargement.modele.agents.find((agent) => agent.statut === "erreur");
  if (enErreur) return refus("MODELE_INVALIDE", enErreur.fichier);

  const modele = { agents: chargement.modele.agents.flatMap((a) => agentDe(a, adaptateur.id)) };
  const problemes = adaptateur.valider(modele);
  if (problemes.length > 0) {
    return refus("MODELE_INVALIDE", problemes.map((p) => `${p.code} : ${p.detail}`).join(" ; "));
  }
  const exportes = adaptateur.exporter(modele);

  const manifesteLu = await lire(fichiers, racine, MANIFESTE);
  if ("erreur" in manifesteLu) return manifesteLu;
  const entrees = lireManifeste(manifesteLu.octets);
  if (entrees === null) return refus("MANIFESTE_INVALIDE", MANIFESTE);

  const ecrasements = await verifierEcrasements(fichiers, racine, exportes, entrees, options);
  if (ecrasements) return ecrasements;

  const nouvelles = await Promise.all(exportes.map((f) => entreeManifeste(f, adaptateur.id)));
  return {
    lot: [
      ...exportes.map(({ chemin, contenu }) => ({ chemin, contenu })),
      { chemin: MANIFESTE, contenu: serialiserManifeste(mettreAJourManifeste(entrees, nouvelles)) },
    ],
    fichiers: exportes.map((fichier) => fichier.chemin),
  };
}

/**
 * Refus si un fichier à écrire existe sans être un fichier généré intact ni confirmé (AC-008-4),
 * ou ne peut pas être lu sans suivre de lien ; `null` si tous peuvent être écrits.
 */
async function verifierEcrasements(
  fichiers: ProjectFiles,
  racine: string,
  exportes: readonly FichierExporte[],
  entrees: readonly EntreeManifeste[],
  options: OptionsExport,
): Promise<Refus | null> {
  const aConfirmer: string[] = [];
  for (const { chemin } of exportes) {
    const actuel = await lire(fichiers, racine, chemin);
    if ("erreur" in actuel) return actuel;
    if (actuel.octets === null || options.confirmes?.includes(chemin)) continue;
    const sha256 = await empreinte(actuel.octets);
    // Fichier généré intact (inscrit au manifeste, même empreinte, ADR-001 D5)…
    const genereIntact = entrees.find((e) => e.path === chemin)?.sha256 === sha256;
    // … ou écrasement confirmé pour ce contenu précis.
    const confirme = (options.confirmations ?? []).some(
      (c) => c.chemin === chemin && c.sha256 === sha256,
    );
    if (!genereIntact && !confirme) aConfirmer.push(chemin);
  }
  if (aConfirmer.length === 0) return null;
  return { ...refus("ECRASEMENT_A_CONFIRMER", aConfirmer.join(", ")), aConfirmer };
}

function refus(code: CodeErreurExport, detail: string): Refus {
  return { ok: false, erreur: { code, detail } };
}

/**
 * Agent valide du modèle dont l'outil est la cible ; rôle et description absents = `""` ;
 * instructions (`agents/<nom>.md`) seulement si le fichier existe.
 */
function agentDe(agent: AgentCharge, cible: string): AgentAExporter[] {
  if (agent.statut !== "ok" || agent.donnees.target !== cible) return [];
  const { id, name, role, description } = agent.donnees;
  return [
    {
      id: String(id),
      name: String(name),
      role: typeof role === "string" ? role : "",
      description: typeof description === "string" ? description : "",
      ...(agent.instructions === null ? {} : { instructions: agent.instructions }),
    },
  ];
}

/** Octets actuels (`null` : absent) ; un lien ou un fichier illisible est un refus. */
async function lire(
  fichiers: ProjectFiles,
  racine: string,
  chemin: string,
): Promise<{ octets: Uint8Array | null } | Refus> {
  try {
    return { octets: await fichiers.readFile(racine, chemin) };
  } catch (erreur) {
    return refus(
      readFailureReason(erreur) === "link" ? "FICHIER_LIEN" : "FICHIER_ILLISIBLE",
      chemin,
    );
  }
}

/** Entrée du manifeste du fichier écrit, empreinte de son contenu (CRLF → LF). */
async function entreeManifeste(fichier: FichierExporte, adaptateur: string) {
  return {
    path: fichier.chemin,
    adapter: adaptateur,
    source: fichier.source,
    sha256: await empreinte(new TextEncoder().encode(fichier.contenu)),
  };
}
