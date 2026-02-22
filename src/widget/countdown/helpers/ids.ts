import type { CountdownUiSlide } from 'src/services/countdown'

export function slideName(s: CountdownUiSlide): string {
  const key = encodeURIComponent(`${s.countdownId}::${s.occKey}`)
  return `cd:${key}`
}

export function pagesKey(pages: Array<{ name: string }>): string {
  // stable identity of the stack; if this string doesn't change we do NOT rebuild
  return pages.map((p) => p.name).join('|')
}
