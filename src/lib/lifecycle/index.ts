// ─────────────────────────────────────────────────────────────────
// src/lib/lifecycle/index.ts
//
// LifecycleManager: declarative, phased application boot sequencer.
//
// AGS TRACKING CONTEXT — THE RULE
// ════════════════════════════════
// AGS reactive cleanup (.as(), subscribe, onCleanup) MUST run inside
// the synchronous createRoot() established by app.start when it calls
// main(). ANY await — including one before the first widget mount —
// permanently exits that root for the current call chain.
//
// REQUIRED PATTERN in app.tsx:
//
//   lifecycle.bootCoreServices();   // fire-and-forget before app.start
//
//   app.start({
//     async main() {
//       lifecycle.mountWidgets();          // sync — must be first, no await before
//       await lifecycle.bootLazyServices(); // async — all widgets already built
//     }
//   });
// ─────────────────────────────────────────────────────────────────

import GLib from 'gi://GLib?version=2.0';
import type { AppPhase, ServiceDef, WidgetDef } from './types';
import { perf } from './perf';

// ── Phase ordering ────────────────────────────────────────────────

const PHASE_ORDER: Record<AppPhase, number> = {
  uninit: 0,
  coreServices: 1,
  widgets: 2,
  lazyServices: 3,
  ready: 4,
  error: 5,
};

// ── LifecycleManager ─────────────────────────────────────────────

export class LifecycleManager {
  private _phase: AppPhase = 'uninit';
  private _services: ServiceDef[] = [];
  private _widgets: WidgetDef[] = [];
  private _started: Set<string> = new Set();
  private _phaseListeners: Map<AppPhase, Array<() => void>> = new Map();

  // ── Registration ────────────────────────────────────────────────

  register(def: ServiceDef): this {
    this._services.push(def);
    return this;
  }

  registerWidget(def: WidgetDef): this {
    this._widgets.push(def);
    return this;
  }

  // ── Queries ─────────────────────────────────────────────────────

  currentPhase(): AppPhase {
    return this._phase;
  }

  isStarted(serviceId: string): boolean {
    return this._started.has(serviceId);
  }

  // ── Phase listener ───────────────────────────────────────────────

  onPhase(phase: AppPhase, cb: () => void): () => void {
    const currentRank = PHASE_ORDER[this._phase];
    const targetRank = PHASE_ORDER[phase];

    if (currentRank >= targetRank && this._phase !== 'uninit') {
      cb();
      return () => { };
    }

    if (!this._phaseListeners.has(phase)) {
      this._phaseListeners.set(phase, []);
    }
    const listeners = this._phaseListeners.get(phase)!;
    listeners.push(cb);

    return () => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  // ── Boot API ─────────────────────────────────────────────────────

  /**
   * STEP 1 — Call BEFORE app.start, fire-and-forget (do NOT await).
   *
   * Starts core services (session, options, etc.) as early as possible
   * so they are ready — or nearly ready — by the time main() runs.
   * Because this is not awaited, it does not block GTK startup or
   * touch the tracking context.
   *
   * Failure transitions to 'error' and logs — does NOT throw since
   * there is no caller to catch it.
   */
  bootCoreServices(): void {
    void this._runCoreServices().catch(err => {
      this._transition('error');
      console.error('[lifecycle] core services failed:', err);
    });
  }

  /**
   * STEP 2 — Call synchronously at the TOP of app.start main(),
   * before ANY await.
   *
   * Mounts all registered widgets in priority order while still inside
   * the createRoot tracking context. This is the only safe place to
   * construct AGS reactive widgets.
   */
  mountWidgets(): void {
    this._transition('widgets');
    const sorted = [...this._widgets].sort((a, b) => a.priority - b.priority);
    for (const w of sorted) {
      const t0 = GLib.get_monotonic_time();
      w.mount();
      const durationMs = (GLib.get_monotonic_time() - t0) / 1000;
      perf.record('widget', w.id, durationMs);
    }
  }

  /**
   * STEP 3 — Await inside app.start main(), after mountWidgets().
   *
   * Runs lazy services in parallel waves. Safe to await here because
   * all widget construction is already done. Failures are logged but
   * do not crash the shell.
   */
  async bootLazyServices(): Promise<void> {
    this._transition('lazyServices');
    await this._runLazyServices();
    this._transition('ready');
    perf.record('phase', 'ready', 0);
  }

  // ── Private helpers ──────────────────────────────────────────────

  private _transition(phase: AppPhase): void {
    this._phase = phase;
    perf.record('phase', phase, 0);
    const listeners = this._phaseListeners.get(phase);
    if (listeners) {
      for (const cb of [...listeners]) cb();
    }
  }

  private async _runCoreServices(): Promise<void> {
    this._transition('coreServices');
    const sorted = this._topoSort(
      this._services.filter(s => s.phase === 'core'),
    );
    for (const svc of sorted) {
      await perf.wrap('service', svc.id, svc.start);
      this._started.add(svc.id);
    }
  }

  private async _runLazyServices(): Promise<void> {
    const lazy = this._services.filter(s => s.phase === 'lazy');
    const pending = new Set(lazy.map(s => s.id));
    const serviceById = new Map(lazy.map(s => [s.id, s]));

    while (pending.size > 0) {
      const wave: ServiceDef[] = [];
      for (const id of pending) {
        const svc = serviceById.get(id)!;
        if ((svc.deps ?? []).every(d => this._started.has(d))) {
          wave.push(svc);
        }
      }

      if (wave.length === 0) {
        console.warn(
          `[lifecycle] lazy services stalled — unsatisfied deps for: ${[...pending].join(', ')}`,
        );
        break;
      }

      for (const svc of wave) pending.delete(svc.id);

      await Promise.all(
        wave.map(async svc => {
          try {
            await perf.wrap('service', svc.id, svc.start);
            this._started.add(svc.id);
          } catch (err) {
            console.error(`[lifecycle] lazy service '${svc.id}' failed (non-fatal):`, err);
          }
        }),
      );
    }
  }

  private _topoSort(defs: ServiceDef[]): ServiceDef[] {
    const byId = new Map(defs.map(s => [s.id, s]));
    const result: ServiceDef[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string, path: string[]): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`[lifecycle] dependency cycle: ${[...path, id].join(' → ')}`);
      }
      const svc = byId.get(id);
      if (!svc) return;
      visiting.add(id);
      for (const dep of svc.deps ?? []) visit(dep, [...path, id]);
      visiting.delete(id);
      visited.add(id);
      result.push(svc);
    };

    for (const svc of defs) visit(svc.id, []);
    return result;
  }
}

// ── Singleton ────────────────────────────────────────────────────

export const lifecycle = new LifecycleManager();
