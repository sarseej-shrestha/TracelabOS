export type SkillNode = { id: string; prerequisites: readonly string[] };
/** Validate the whole graph, including disconnected components, before selecting practice. */
export function prerequisiteOrder(
  graph: readonly SkillNode[],
  target: string,
): string[] {
  const nodes = new Map(graph.map((node) => [node.id, node]));
  if (nodes.size !== graph.length || !nodes.has(target))
    throw new Error('INVALID_SKILL_GRAPH');
  const visited = new Set<string>(),
    active = new Set<string>();
  const walk = (id: string, output: string[]) => {
    if (active.has(id) || !nodes.has(id))
      throw new Error('INVALID_SKILL_GRAPH');
    if (visited.has(id)) return;
    active.add(id);
    for (const prerequisite of nodes.get(id)!.prerequisites)
      walk(prerequisite, output);
    active.delete(id);
    visited.add(id);
    output.push(id);
  };
  for (const node of graph) walk(node.id, []);
  visited.clear();
  const result: string[] = [];
  walk(target, result);
  return result.filter((id) => id !== target);
}
