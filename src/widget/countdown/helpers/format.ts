export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)

  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60

  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours || days) parts.push(`${hours}h`)
  if (mins || hours || days) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) {
    const ago = -ms
    // Keep it short.
    if (ago < 60_000) return 'Reached'
    return `Reached ${formatDuration(ago)} ago`
  }
  return formatDuration(ms)
}
