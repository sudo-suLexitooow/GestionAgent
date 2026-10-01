import { useCallback, useEffect, useRef, useState } from "react";
import type { ChargementModele } from "../core/cadre/charger-modele";
import {
  versErreurEnregistrement,
  type ErreurEnregistrement,
  type ResultatEnregistrement,
} from "../core/cadre/enregistrer";
import { enregistrerCadrage } from "../core/cadre/enregistrer-cadrage";
import type { AgentNouveau } from "../core/agents/agent";
import type { ImportedContext } from "../core/contexts/context";
import type { ContextImport } from "../core/contexts/import-contexts";
import type { SystemeFichiersProjet } from "../core/fichiers/systeme-fichiers";
import { SystemeFichiersTauri } from "../platform/systeme-fichiers-tauri";
import { SaveBar } from "./SaveBar";
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

/** Nom de chaque fichier `.cadre/agents/<nom>.yaml` du modèle chargé, même en erreur. */
function nomsAgentsEnregistres(chargement: ChargementModele | null): string[] {
  if (chargement?.etat !== "charge") return [];
  return chargement.modele.agents.map(({ fichier }) =>
    fichier.slice(".cadre/agents/".length, -".yaml".length),
  );
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
  const [importe, setImporte] = useState<ContextImport | null>(null);
  /** `null` tant que le modèle n'est pas (re)lu : aucune création d'agent possible. */
  const [chargement, setChargement] = useState<ChargementModele | null>(null);
  const [nouveaux, setNouveaux] = useState<AgentNouveau[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<ErreurEnregistrement | null>(null);
  // Garde synchrone : deux clics avant le rendu suivant ne lancent qu'un enregistrement.
  const enregistrementEnCours = useRef(false);

  const surChargement = useCallback((resultat: ChargementModele) => {
    setChargement(resultat);
  }, []);
  const lectureSeule = chargement?.etat === "charge" && chargement.lectureSeule;
  const modifiable =
    chargement?.etat === "aucun" || (chargement?.etat === "charge" && !chargement.lectureSeule);

  async function enregistrer(contextes: readonly ImportedContext[]) {
    if (enregistrementEnCours.current) return;
    enregistrementEnCours.current = true;
    setEnCours(true);
    setErreur(null);
    const agents = nouveaux;
    let resultat: ResultatEnregistrement;
    try {
      resultat = await enregistrerCadrage(
        { fichiers: files, systeme },
        project.path,
        { contextes, agents },
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
    // Succès, ou refus qui rend l'import caduc : le projet est relu (modèle ou nouvel import).
    if (resultat.ok) setNouveaux((actuels) => actuels.filter((agent) => !agents.includes(agent)));
    if (resultat.ok || REFUS_A_RELIRE.has(resultat.erreur.code)) {
      setImporte(null);
      setChargement(null);
      setLecture((n) => n + 1);
    }
  }

  const contextes = importe?.contexts ?? [];
  const modifie = contextes.length > 0 || nouveaux.length > 0;
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
          if (modifie) void enregistrer(contextes);
        }}
      />
      <ModelSection
        key={`m${String(lecture)}`}
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
      />
      <ContextsSection
        key={`c${String(lecture)}`}
        root={project.path}
        files={files}
        adapter={claudeCodeAdapter}
        onImported={setImporte}
      />
      <SkillsSection root={project.path} files={files} adapter={claudeCodeAdapter} />
    </main>
  );
}
