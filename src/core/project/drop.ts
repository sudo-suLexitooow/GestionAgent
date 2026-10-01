export type DropDecision = { kind: "candidate"; path: string } | { kind: "rejected" };

export function decideDrop(_paths: readonly string[]): DropDecision {
  return { kind: "rejected" };
}
