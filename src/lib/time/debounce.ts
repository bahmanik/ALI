import { timeout, type Timer } from "ags/time";

export type Debouncer = {
  schedule: (fn: () => unknown, ms?: number) => void;
  cancel: () => void;
  flush: () => void;
  readonly pending: boolean;
};

export function createDebouncer(defaultMs: number): Debouncer {
  let t: Timer | undefined;
  let last: (() => unknown) | undefined;

  return {
    schedule(fn, ms = defaultMs) {
      last = fn;
      t?.cancel();
      t = timeout(ms, () => {
        t = undefined;
        const f = last;
        last = undefined;
        if (f) f();
      });
    },
    cancel() {
      t?.cancel();
      t = undefined;
      last = undefined;
    },
    flush() {
      if (!t) return;
      t.cancel();
      t = undefined;
      const f = last;
      last = undefined;
      if (f) f();
    },
    get pending() {
      return !!t;
    },
  };
}
