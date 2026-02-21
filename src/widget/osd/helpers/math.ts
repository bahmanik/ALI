export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function boolPeek(acc: any): boolean {
  try {
    return Boolean(acc?.peek?.());
  } catch {
    try {
      return Boolean(acc?.get?.());
    } catch {
      return Boolean(acc);
    }
  }
}
