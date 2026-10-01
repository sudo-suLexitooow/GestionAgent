// Manifeste des fichiers générés ou adoptés par Cadre, `.cadre/generated.yaml` (ADR-001, D5).
import { stringify } from "yaml";

export interface FichierGenere {
  /** Relatif au projet, séparateur `/`. */
  path: string;
  /** Identifiant de l'adaptateur qui produit le fichier. */
  adapter: string;
  /** `agent:<id>`, `skill:<nom>` ou `contexts`. */
  source: string;
  /** Empreinte du dernier contenu écrit ou adopté (voir `empreinte`). */
  sha256: string;
}

/** UTF-8 sans BOM, LF, indentation 2, ligne finale (ADR-001, D1). */
export function serialiserManifeste(files: readonly FichierGenere[]): string {
  return stringify({ files }, { indent: 2, indentSeq: true, lineWidth: 0 });
}
