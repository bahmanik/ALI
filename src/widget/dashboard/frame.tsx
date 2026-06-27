import { Gtk } from "ags/gtk4"
import { With } from "ags"
import options from "src/configuration"
import { isMenuKey, MenuRenderer } from "src/widget/shared/menus"
import type { ModuleMapArray } from "src/configuration/types"

/**
 * Renders a snapshot of the dashboard grid from a resolved `ModuleMapArray`.
 *
 * Each `GridChild.module` is a `MenuKey` — looked up in the shared `menuMap`
 * and rendered via the shared `MenuRenderer`. The same renderer the bar uses
 * inside trigger popovers, just attached to a grid cell instead.
 *
 * `Gtk.Grid.attach()` is imperative so we build inside a `$` callback.
 * `With` above re-mounts this component whenever the stored layout changes,
 * giving full reactivity without manual diffing.
 */
function DashboardGrid({ modules }: { modules: ModuleMapArray }) {
  return (
    <Gtk.Grid
      $={(self) => {
        for (const child of modules) {
          if (!isMenuKey(child.module)) {
            console.warn(`[Dashboard] Unknown menu key: "${child.module}" — skipping`)
            continue
          }

          // Render as a single-node MenuNode tree so the same shared renderer
          // handles both simple cells (one widget) and future composite cells
          // (MenuContainerNode trees).
          const widget = <MenuRenderer
            nodes={[{ kind: "menu-widget", id: child.module, widget: child.module }]}
          /> as Gtk.Widget

          self.attach(widget, child.column, child.row, child.width, child.height)
        }
      }}
    />
  )
}

/**
 * Config-driven dashboard frame.
 *
 * Reads `options.dashboard.grid.modulesList` and re-renders the grid
 * whenever the stored layout changes (e.g. after editing in Settings).
 */
function Frame() {
  return (
    <With value={options.dashboard.grid.modulesList.as(v => v)}>
      {(modules) => <DashboardGrid modules={modules} />}
    </With>
  )
}

export default Frame
