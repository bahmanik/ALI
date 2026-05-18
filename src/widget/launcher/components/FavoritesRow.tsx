import { Gtk } from "ags/gtk4"
import options from "src/configuration"
import type AstalApps from "gi://AstalApps?version=0.1"
import { numMin } from "../helpers"

export function FavoritesRow({
  apps,
  hideWindow,
}: {
  apps: AstalApps.Apps
  hideWindow: () => void
}) {
  if (!options.launcher.showFavorites.get()) return <box />

  const favorites = (options.launcher.favorites.get() ?? []) as string[]
  const iconPx  = numMin(8, options.launcher.icons.favorite.get(), 42)
  const spacing = numMin(0, options.launcher.favoritesUI.spacing.get(), 10)

  return (
    <box class="launcher-favorites" spacing={spacing} orientation={Gtk.Orientation.HORIZONTAL}>
      {favorites.map((id) => {
        const app = apps.exact_query(id)[0]
        if (!app) return <box />

        return (
          <button
            hexpand
            cssClasses={["launcher-favorite"]}
            onClicked={() => { app.launch(); hideWindow() }}
            focusOnClick={false}
          >
            <image iconName={app.iconName} pixelSize={iconPx} />
          </button>
        )
      })}
    </box>
  )
}
