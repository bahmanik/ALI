export function chunk7<T>(xs: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += 7) out.push(xs.slice(i, i + 7));
  return out;
}
