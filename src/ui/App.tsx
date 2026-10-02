import { useCallback, useEffect, useRef, useState } from "react";
import { nomsDesAgents, type ChargementModele } from "../core/cadre/charger-modele";
import {
  versErreurEnregistrement,
  type ErreurEnregistrement,
  type ResultatEnregistrement,
} from "../core/cadre/enregistrer";
import { enregistrerCadrage } from "../core/cadre/enregistrer-cadrage";
import type { AgentNouveau } from "../core/agents/agent";
import type { ImportedContext } from "../core/contexts/context";
import type { ProjetImporte } from "../core/import/importer-projet";
import type { ImportedSkill, SkillImportFailure } from "../core/skills/import-skills";
import type { SystemeFichiersProjet } from "../core/fichiers/systeme-fichiers";
import { SystemeFichiersTauri } from "../platform/systeme-fichiers-tauri";
import { SaveBar } from "./SaveBar";
import { SkillFailures } from "./SkillFailures";
import { VERSION_CADRE } from "./version";
import {
  openFromDrop,
  openFromPicker,
  type OpenError,
  type OpenOutcome,
  type Project,
} from "../core/project/open-project";
import type { DropSource, FolderAccess, ProjectFiles, ProjectWarning } from "../core/project/ports";
import { claudeCodeAdapter } from "../core/adapters/claude-code/claude-code-adapter";
import {
  tauriDropSource,
  tauriFolderAccess,
  tauriProjectFiles,
} from "../platform/tauri-project-ports";
import { t } from "./i18n";
import { AgentsSection } from "./AgentsSection";
import { ContextsSection } from "./ContextsSection";
import { ModelSection } from "./ModelSection";
import { SkillsSection } from "./SkillsSection";

export interface AppProps {
  /** Ports injectés : les vrais (Tauri) par défaut, des faux en mémoire dans les tests. */
  folders?: FolderAccess;
  drops?: DropSource;
  files?: ProjectFiles;
  /** Écriture transactionnelle (US-005), seul chemin d'écriture du projet. */
  systeme?: SystemeFichiersProjet;
}

const systemeTauri = new SystemeFichiersTauri();

/** Refus d'enregistrement qui rendent l'import caduc : le projet doit être relu. */
const REFUS_A_RELIRE: ReadonlySet<string> = new Set(["SOURCE_MODIFIEE", "MODELE_EXISTANT"]);

/** Outils dont un adaptateur est disponible : cibles possibles d'un agent (AC-007-2). */
const ADAPTATEURS = [claudeCodeAdapter];

/** Agents du modèle chargé, même en erreur ; aucun sans modèle. */
function nomsAgentsEnregistres(chargement: ChargementModele | null): string[] {
  return chargement?.etat === "charge" ? nomsDesAgents(chargement.modele) : [];
}

export function App({
  folders = tauriFolderAccess,
  drops = tauriDropSource,
  files = tauriProjectFiles,
  systeme = systemeTauri,
}: AppProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [warning, setWarning] = useState<ProjectWarning | null>(null);
  const [error, setError] = useState<OpenError | null>(null);

  function show(outcome: OpenOutcome) {
    if (outcome.kind === "opened") {
      setProject(outcome.project);
      setWarning(outcome.warning ?? null);
    }
    setError(outcome.kind === "error" ? outcome.error : null);
  }

  // Le dépôt d'un dossier n'est écouté que sur l'accueil.
  useEffect(() => {
    if (project) return;
    const subscription = drops.onDrop((paths) => {
      void openFromDrop(folders, paths).then(show);
    });
    return () => {
      void subscription.then((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [drops, folders, project]);

  if (project)
    return <ProjectScreen project={project} warning={warning} files={files} systeme={systeme} />;
  return <HomeScreen error={error} onOpen={() => void openFromPicker(folders).then(show)} />;
}

function HomeScreen({ error, onOpen }: { error: OpenError | null; onOpen: () => void }) {
  return (
    <main>
      <h1>{t("app.title")}</h1>
      <button type="button" onClick={onOpen}>
        {t("home.open")}
      </button>
      <p>{t("home.dropHint")}</p>
      {error && <p role="alert">{t(`error.${error}`)}</p>}
    </main>
  );
}

/** Libellé d'un avertissement de reprise selon son code système. */
function warningLabel(code: string): string {
  if (code === "PROJET_OCCUPE") return t("openWarning.busy");
  if (code === "RECUPERATION_IMPOSSIBLE") return t("openWarning.setAside");
  if (code === "CHEMIN_INVALIDE") return t("openWarning.invalidPath");
  return t("openWarning.generic");
}

function ProjectScreen({
  project,
  warning,
  files,
  systeme,
}: {
  project: Project;
  warning: ProjectWarning | null;
  files: ProjectFiles;
  systeme: SystemeFichiersProjet;
}) {
  /** Incrémenté pour relire le projet (modèle, proposition d'import) après un enregistrement. */
  const [lecture, setLecture] = useState(0);
  /** Incrémenté pour relire seulement le modèle (agent apparu sur le disque, AC-007-3). */
  const [lectureModele, setLectureModele] = useState(0);
  const [importe, setImporte] = useState<ProjetImporte | null>(null);
  /** `null` tant que le modèle n'est pas (re)lu : aucune création d'agent possible. */
  const [chargement, setChargement] = useState<ChargementModele | null>(null);
  const [nouveaux, setNouveaux] = useState<AgentNouveau[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<ErreurEnregistrement | null>(null);
  /** Skills de l'outil non copiées dans le modèle créé au dernier enregistrement (US-004). */
  const [nonImportees, setNonImportees] = useState<readonly SkillImportFailure[]>([]);
  // Garde synchrone : deux clics avant le rendu suivant ne lancent qu'un enregistrement.
  const enregistrementEnCours = useRef(false);

  const surChargement = useCallback((resultat: ChargementModele) => {
    setChargement(resultat);
  }, []);
  const lectureSeule = chargement?.etat === "charge" && chargement.lectureSeule;
  const modifiable =
    chargement?.etat === "aucun" || (chargement?.etat === "charge" && !chargement.lectureSeule);

  async function enregistrer(
    contextes: readonly ImportedContext[],
    /** Absentes si l'import n'a pas été demandé : le cœur les importe en créant le modèle. */
    skills: readonly ImportedSkill[] | undefined,
  ) {
    if (enregistrementEnCours.current) return;
    enregistrementEnCours.current = true;
    setEnCours(true);
    setErreur(null);
    setNonImportees([]);
    const agents = nouveaux;
    let resultat: ResultatEnregistrement;
    try {
      resultat = await enregistrerCadrage(
        { fichiers: files, systeme },
        project.path,
        skills === undefined ? { contextes, agents } : { contextes, agents, skills },
        { adapter: claudeCodeAdapter, generatorVersion: VERSION_CADRE },
      );
    } catch (exception) {
      // Filet : le cœur ne rejette pas, mais le bouton ne doit jamais rester bloqué.
      resultat = { ok: false, erreur: versErreurEnregistrement(exception) };
    } finally {
      enregistrementEnCours.current = false;
      setEnCours(false);
    }
    if (!resultat.ok) setErreur(resultat.erreur);
    else setNonImportees(resultat.skillsNonImportees ?? []);
    // Succès, ou refus qui rend l'import caduc : le projet est relu (modèle ou nouvel import).
    if (resultat.ok) setNouveaux((actuels) => actuels.filter((agent) => !agents.includes(agent)));
    if (resultat.ok || REFUS_A_RELIRE.has(resultat.erreur.code)) {
      setImporte(null);
      setChargement(null);
      setLecture((n) => n + 1);
    } else if (resultat.erreur.code === "AGENT_EXISTANT") {
      // Seul le modèle est relu, pour afficher l'agent apparu ; le reste du cadrage est gardé.
      setChargement(null);
      setLectureModele((n) => n + 1);
    }
  }

  const contextes = importe?.contexts ?? [];
  const skills = importe?.skills.skills;
  const modifie = contextes.length > 0 || (skills?.length ?? 0) > 0 || nouveaux.length > 0;
  return (
    <main>
      <h1>{project.name}</h1>
      {warning && (
        <p role="status">
          {warningLabel(warning.code)}
          {warning.detail && (
            <>
              {" "}
              {t("openWarning.detail")} : <code>{warning.detail}</code>
            </>
          )}
        </p>
      )}
      <p>
        {t("project.path")} : <code>{project.path}</code>
      </p>
      <SaveBar
        modifie={modifie}
        lectureSeule={lectureSeule}
        enCours={enCours}
        erreur={erreur}
        onSave={() => {
          if (modifie) void enregistrer(contextes, skills);
        }}
      />
      <SkillFailures failures={nonImportees} />
      <ModelSection
        key={`m${String(lecture)}-${String(lectureModele)}`}
        root={project.path}
        files={files}
        onLoaded={surChargement}
      />
      <AgentsSection
        enregistres={nomsAgentsEnregistres(chargement)}
        nouveaux={nouveaux}
        adaptateurs={ADAPTATEURS}
        desactive={!modifiable}
        onCreate={(agent) => {
          setNouveaux((actuels) => [...actuels, agent]);
        }}
        onRemove={(retire) => {
          setNouveaux((actuels) => actuels.filter((agent) => agent !== retire));
        }}
      />
      <ContextsSection
        key={`c${String(lecture)}`}
        root={project.path}
        files={files}
        adapter={claudeCodeAdapter}
        onImported={setImporte}
      />
      <SkillsSection
        key={`s${String(lecture)}`}
        root={project.path}
        files={files}
        adapter={claudeCodeAdapter}
      />
    </main>
  );
}
