export type DropDecision = { kind: "candidate"; path: string } | { kind: "rejected" };

export function decideDrop(paths: readonly string[]): DropDecision {
  const [path] = paths;
  return path === undefined ? { kind: "rejected" } : { kind: "candidate", path };
}
