import { Opt } from "src/lib/options/opt"
import { configManager } from "src/lib/options"
import { menuDefaults } from "src/widget/shared/menus/menuDefaults"
import { isMenuKey } from "src/widget/shared/menus/menuKeys"
import type { MenuKey } from "src/widget/shared/menus/menuKeys"
import type { NodeId, MenuNode } from "src/widget/shared/menus/types"
import type { BarSlotLayout, BarNode } from "src/configuration/widgets/bar/type"
import type { ModuleMapArray } from "src/configuration/types"
import { barDefaultLayout } from "src/configuration/widgets/bar"

// ─── NodeId → MenuKey collection ──────────────────────────────────────────────

function collectFromMenuNodes(nodes: MenuNode[], out: Map<NodeId, MenuKey>): void {
  for (const node of nodes) {
    if (node.kind === "menu-widget") {
      if (isMenuKey(node.widget)) out.set(node.id, node.widget)
    } else if (node.kind === "menu-container") {
      collectFromMenuNodes(node.children, out)
    }
  }
}

function collectFromBarNode(barNode: BarNode, out: Map<NodeId, MenuKey>): void {
  if (barNode.kind === "trigger") {
    collectFromMenuNodes(barNode.children, out)
  } else if (barNode.kind === "group") {
    for (const child of barNode.children) collectFromBarNode(child, out)
  }
}

function collectFromBarLayout(layout: BarSlotLayout, out: Map<NodeId, MenuKey>): void {
  for (const slot of [layout.start, layout.center, layout.end]) {
    for (const barNode of slot) collectFromBarNode(barNode, out)
  }
}

// ─── Opt subtree types ────────────────────────────────────────────────────────

export type FieldOptMap    = Record<string, Opt<unknown>>
export type InstanceOptTree = Record<NodeId, FieldOptMap>

// ─── Build ────────────────────────────────────────────────────────────────────

function buildOptSubtree(pairs: Map<NodeId, MenuKey>): InstanceOptTree {
  const tree: InstanceOptTree = {}

  for (const [nodeId, menuKey] of pairs) {
    tree[nodeId] = {}

    // menuDefaults[menuKey] has a specific object type per key, but accessed
    // through a generic MenuKey it becomes the union of all value types.
    // Object.entries on that union loses specificity, so cast to a known shape.
    // The actual runtime values are always Opt<T> — the cast is safe.
    const defaults = menuDefaults[menuKey] as Record<string, Opt<unknown>>

    for (const [field, defaultOpt] of Object.entries(defaults)) {
      // Use the global default's hardcoded initial as this instance's initial.
      // Do NOT set .id or call .init() — OptionRegistry.boot() handles both,
      // assigning ids like "menuInstances.instances.n_abc.format".
      tree[nodeId][field] = new Opt(defaultOpt.initial, configManager)
    }
  }

  return tree
}

// ─── Public ───────────────────────────────────────────────────────────────────

export function buildInstanceOptTree(): InstanceOptTree {
  const rawConfig = configManager.readConfig()
  const pairs     = new Map<NodeId, MenuKey>()

  const storedDefault =
    rawConfig["bar.modules.defaultLayout"] as BarSlotLayout | undefined
  collectFromBarLayout(storedDefault ?? barDefaultLayout, pairs)

  const storedMonitor =
    rawConfig["bar.modules.monitorLayouts"] as Record<string, BarSlotLayout> | undefined
  if (storedMonitor) {
    for (const layout of Object.values(storedMonitor)) {
      collectFromBarLayout(layout, pairs)
    }
  }

  const storedGrid =
    rawConfig["dashboard.grid.modulesList"] as ModuleMapArray | undefined
  if (storedGrid) {
    for (const child of storedGrid) {
      const nodeId = child.id ?? child.module
      if (nodeId && isMenuKey(child.module)) {
        pairs.set(nodeId, child.module)
      }
    }
  }

  return buildOptSubtree(pairs)
}
