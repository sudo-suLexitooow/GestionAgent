import type { ToolAdapter } from "../adapters/adapter";
import type { ProjectFiles } from "../project/ports";
import type { ListedSkill } from "./skill";

/** Skills du projet ouvert (SKL-01, PRJ-02). */
export function listProjectSkills(
  _files: ProjectFiles,
  _root: string,
  _adapter: ToolAdapter,
): Promise<ListedSkill[]> {
  return Promise.resolve([
    { folder: "non implémenté", status: "error", issue: { code: "unreadable" } },
  ]);
}
