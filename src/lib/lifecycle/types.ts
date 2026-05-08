export type PerfKind = 'service' | 'widget' | 'phase';

export type PerfEntry = {
  kind: PerfKind;
  id: string;
  durationMs: number;
  /** Milliseconds elapsed since BootPerfMonitor was constructed. */
  startedAtMs: number;
};

export type AppPhase =
  | 'uninit'
  | 'coreServices'
  | 'lazyServices'
  | 'widgets'
  | 'ready'
  | 'error';

export type ServiceDef = {
  id: string;
  phase: 'core' | 'lazy';
  /**
   * IDs of other registered services that must be started first.
   * Only list direct dependencies — not transitive ones.
   */
  deps?: string[];
  start: () => Promise<void>;
};

export type WidgetDef = {
  id: string;
  /**
   * Lower number mounts first.
   * Use increments of 10 to leave room between entries.
   */
  priority: number;
  mount: () => void;
};
