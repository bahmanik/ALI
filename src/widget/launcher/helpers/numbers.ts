export function numMin(min: number, value: unknown, fallback: number): number {
  return Math.max(min, Number(value ?? fallback))
}

export function numMax(max: number, value: unknown, fallback: number): number {
  return Math.min(max, Number(value ?? fallback))
}
