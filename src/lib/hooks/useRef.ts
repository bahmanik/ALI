// ─────────────────────────────────────────────────────────────────────────────
//  useRef<T>
//  Stable mutable container.  Avoids bare `let` for widget-level state.
// ─────────────────────────────────────────────────────────────────────────────
const useRef = <T>(initial: T): { current: T } => ({ current: initial })

export default useRef
