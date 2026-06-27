import type { MenuKey } from "./menuMap"

/**
 * Shared menu node tree types.
 *
 * These types define the composable menu tree structure used by MenuRenderer.
 * Both the bar (trigger popovers) and the dashboard (grid cells) store and
 * render these trees — any widget that imports MenuRenderer can use them.
 *
 * Previously defined in src/configuration/widgets/bar/type.ts; moved here so
 * the types live alongside the map and renderer that give them meaning.
 */

/** Opaque node identifier generated once at creation time (e.g. "n_abc123"). */
export type NodeId = string

// ─── Leaf: a single named menu component ──────────────────────────────────────

/**
 * Renders the menu component at `menuMap[widget]`.
 * This is the most common node — one menu component in a tree position.
 */
export interface MenuWidgetNode {
  kind: "menu-widget"
  id: NodeId
  widget: MenuKey
}

// ─── Branch: layout container holding child nodes ─────────────────────────────

/**
 * A box that arranges child MenuNodes horizontally or vertically.
 * Use horizontal to place multiple menus side-by-side inside one popover.
 */
export interface MenuContainerNode {
  kind: "menu-container"
  id: NodeId
  direction: "horizontal" | "vertical"
  spacing: number       // px between children, default 0
  minimumWidth: number  // 0 = natural size
  children: MenuNode[]
}

// ─── Structural helpers ───────────────────────────────────────────────────────

/** A visual GTK separator line between menu sections. */
export interface MenuDividerNode {
  kind: "menu-divider"
  id: NodeId
}

/** A blank spacer of fixed pixel size. */
export interface MenuSpacerNode {
  kind: "menu-spacer"
  id: NodeId
  size: number   // px, default 16
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type MenuNode =
  | MenuWidgetNode
  | MenuContainerNode
  | MenuDividerNode
  | MenuSpacerNode
