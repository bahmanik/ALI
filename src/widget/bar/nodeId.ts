export function generateNodeId(): string {
  return "n_" + Math.random().toString(36).slice(2, 8)
}
