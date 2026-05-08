import GLib from 'gi://GLib?version=2.0';
import type { PerfEntry, PerfKind } from './types';

// ── Bar rendering ────────────────────────────────────────────────

const BAR_CHAR = '█';

/** Pixels (chars) per ms — different scales for services vs widgets. */
const SCALE: Record<PerfKind, number> = {
  service: 10, // 1 block = 10 ms
  widget: 2,   // 1 block = 2 ms
  phase: 0,    // phases show no bar (duration is always 0)
};

function bar(kind: PerfKind, durationMs: number): string {
  const scale = SCALE[kind];
  if (scale === 0 || durationMs <= 0) return '';
  const blocks = Math.max(1, Math.round(durationMs / scale));
  return BAR_CHAR.repeat(blocks);
}

// ── BootPerfMonitor ──────────────────────────────────────────────

export class BootPerfMonitor {
  /**
   * Absolute monotonic origin, captured at construction time.
   * GLib.get_monotonic_time() returns microseconds.
   */
  private readonly _origin: number;

  private readonly _entries: PerfEntry[] = [];

  constructor() {
    // GLib.get_monotonic_time() returns microseconds (µs).
    // We convert to milliseconds everywhere else.
    this._origin = GLib.get_monotonic_time();
  }

  // ── Public API ────────────────────────────────────────────────

  /**
   * Record a completed timing entry.
   *
   * @param kind       – 'service' | 'widget' | 'phase'
   * @param id         – human-readable identifier
   * @param durationMs – wall-clock duration of the operation
   */
  record(kind: PerfKind, id: string, durationMs: number): void {
    const nowUs = GLib.get_monotonic_time();
    // _origin and nowUs are both in µs; convert difference to ms.
    const startedAtMs = (nowUs - this._origin) / 1000 - durationMs;
    this._entries.push({ kind, id, durationMs, startedAtMs });
  }

  /**
   * Time an async function, record the result, and return the value.
   *
   * Usage:
   *   const result = await perf.wrap('service', 'session', bootSession);
   */
  async wrap<T>(kind: PerfKind, id: string, fn: () => Promise<T>): Promise<T> {
    const t0 = GLib.get_monotonic_time();
    const result = await fn();
    const durationMs = (GLib.get_monotonic_time() - t0) / 1000;
    this.record(kind, id, durationMs);
    return result;
  }

  /**
   * Print a formatted performance report to the console.
   *
   * Groups entries by kind, sorts within each group by durationMs
   * descending, and includes an ASCII bar chart.
   * Also prints time-to-interactive (TTI) derived from the 'ready'
   * phase entry's startedAtMs.
   */
  report(): void {
    const groups: PerfKind[] = ['phase', 'service', 'widget'];
    const WIDTH = 60;
    const divider = '─'.repeat(WIDTH);

    console.log('\n' + '═'.repeat(WIDTH));
    console.log(' Boot Performance Report');
    console.log('═'.repeat(WIDTH));

    for (const kind of groups) {
      const entries = this._entries
        .filter(e => e.kind === kind)
        .sort((a, b) => b.durationMs - a.durationMs);

      if (entries.length === 0) continue;

      console.log(`\n  ${kind.toUpperCase()}S`);
      console.log('  ' + divider);

      for (const e of entries) {
        if (kind === 'phase') {
          const ttiLabel =
            e.id === 'ready'
              ? `  ← TTI ${e.startedAtMs.toFixed(0)} ms`
              : `  +${e.startedAtMs.toFixed(0)} ms`;
          console.log(`  ${e.id.padEnd(24)}${ttiLabel}`);
        } else {
          const dur = `${e.durationMs.toFixed(1)} ms`.padStart(9);
          const b = bar(kind, e.durationMs);
          console.log(`  ${e.id.padEnd(24)} ${dur}  ${b}`);
        }
      }
    }

    // Time-to-interactive summary
    const readyEntry = this._entries.find(
      e => e.kind === 'phase' && e.id === 'ready',
    );
    if (readyEntry) {
      console.log('\n' + '═'.repeat(WIDTH));
      console.log(
        ` Time-to-interactive: ${readyEntry.startedAtMs.toFixed(0)} ms`,
      );
    }

    console.log('═'.repeat(WIDTH) + '\n');
  }
}

export const perf = new BootPerfMonitor();
