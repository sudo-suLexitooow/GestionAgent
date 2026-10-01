import { useCallback, useEffect, useRef, useState } from "react";
import type { ChargementModele } from "../core/cadre/charger-modele";
import {
  versErreurEnregistrement,
  type ErreurEnregistrement,
  type ResultatEnregistrement,
} from "../core/cadre/enregistrer";
import { enregistrerContextesImportes } from "../core/cadre/enregistrer-import";
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
  const [lectureSeule, setLectureSeule] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<ErreurEnregistrement | null>(null);
  // Garde synchrone : deux clics avant le rendu suivant ne lancent qu'un enregistrement.
  const enregistrementEnCours = useRef(false);

  const surChargement = useCallback((chargement: ChargementModele) => {
    setLectureSeule(chargement.etat === "charge" && chargement.lectureSeule);
  }, []);

  async function enregistrer(contextes: ImportedContext[]) {
    if (enregistrementEnCours.current) return;
    enregistrementEnCours.current = true;
    setEnCours(true);
    setErreur(null);
    let resultat: ResultatEnregistrement;
    try {
      resultat = await enregistrerContextesImportes(
        { fichiers: files, systeme },
        project.path,
        contextes,
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
    if (resultat.ok || REFUS_A_RELIRE.has(resultat.erreur.code)) {
      setImporte(null);
      setLecture((n) => n + 1);
    }
  }

  const aEnregistrer = importe && importe.contexts.length > 0 ? importe.contexts : null;
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
        modifie={aEnregistrer !== null}
        lectureSeule={lectureSeule}
        enCours={enCours}
        erreur={erreur}
        onSave={() => {
          if (aEnregistrer) void enregistrer(aEnregistrer);
        }}
      />
      <ModelSection
        key={`m${String(lecture)}`}
        root={project.path}
        files={files}
        onLoaded={surChargement}
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
