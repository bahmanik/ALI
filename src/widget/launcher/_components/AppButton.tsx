import AstalApps from "gi://AstalApps?version=0.1"
import Pango from "gi://Pango?version=1.0"
import { Gtk } from "ags/gtk4"
import type { Accessor } from "gnim"

function escapeMarkup(s: string): string {
   return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
}

function escapeRegex(s: string): string {
   return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function underlineMatches(text: string, query: string): string {
   const t = String(text ?? "")
   const q = String(query ?? "").trim()
   if (!q) return escapeMarkup(t)

   const re = new RegExp(escapeRegex(q), "gi")
   let out = ""
   let last = 0

   for (const m of t.matchAll(re)) {
      const i = m.index ?? -1
      if (i < 0) continue
      out += escapeMarkup(t.slice(last, i))
      out += `<u>${escapeMarkup(m[0])}</u>`
      last = i + m[0].length
   }
   out += escapeMarkup(t.slice(last))
   return out
}

export function AppButton({
   app,
   query,
   iconPx,
   itemGap,
   showDescription,
}: {
   app: AstalApps.Application
   query: Accessor<string>
   iconPx: number
   itemGap: number
   showDescription: boolean
}) {
   const q = query

   return (
      <button hexpand cssClasses={["launcher-item"]} onClicked={() => app.launch()} focusOnClick={false}>
         <box class={"launcher-item-inner"} spacing={Math.max(0, Number(itemGap ?? 14))}>
            <image iconName={app.iconName} pixelSize={Math.max(8, Number(iconPx ?? 36))} />
            <box orientation={Gtk.Orientation.VERTICAL}>
               <label
                  class={"title"}
                  ellipsize={Pango.EllipsizeMode.END}
                  useMarkup={true}
                  label={q.as((qq) => underlineMatches(app.name ?? "", qq))}
               />
               <label
                  visible={Boolean(showDescription)}
                  class={"description"}
                  ellipsize={Pango.EllipsizeMode.END}
                  useMarkup={true}
                  label={q.as((qq) => underlineMatches(app.description ?? "", qq))}
               />
            </box>
         </box>
      </button>
   )
}
