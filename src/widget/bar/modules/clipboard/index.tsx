import app from "ags/gtk4/app"
import icons from "src/lib/icons/icons"
import Cliphist from "src/services/cliphist"
import { Gtk } from "ags/gtk4"
import { createComputed, createState, For, onCleanup } from "ags"
import { ClipImage, ClipColor, ClipText } from "./_components"
import { options } from "src/services/cliphist/options"
import { isColor } from "src/lib/valisation/colors"
import type { BarModuleProps } from "../types"

const clipboard = Cliphist.get_default()
const launcherWidth = 400
const windowPadding = 15
const spacing = 10

const imagePattern = /\[\[ binary data (\d+) (KiB|MiB) (\w+) (\d+)x(\d+) \]\]/

const [text, text_set] = createState("")
let scrolled: Gtk.ScrolledWindow

const list = createComputed([clipboard.list, text], (list, text) => {
  return list.filter((entry) => {
    if (!text) return true
    const content = entry.split("\t").slice(1).join(" ").trim()
    return content.toLowerCase().includes(text.toLowerCase())
  })
})

function ClipButton({ item }: { item: string }) {
  const [id, ...contentParts] = item.split("\t")
  const content = contentParts.join(" ").trim()
  const contentIsImage = options.clipboard.image_preview && content.match(imagePattern)
  const contentIsColor = isColor(content)

  return contentIsColor ? (
    <ClipColor id={id} content={content} />
  ) : contentIsImage ? (
    <ClipImage id={id} content={contentIsImage} />
  ) : (
    <ClipText id={id} content={content} />
  )
}

function Entry() {
  let appconnect: number

  onCleanup(() => {
    if (appconnect) app.disconnect(appconnect)
  })

  const onEnter = () => {
    const item = list.peek()[0]
    const [id] = item.split("\t")
    clipboard.copy(id)
  }

  return (
    <entry
      hexpand
      $={(self) => {
        appconnect = app.connect("window-toggled", async (_, win) => {
          const visible = win.visible
          if (visible) {
            scrolled.set_vadjustment(null)
            await self.set_text("")
            self.grab_focus()
          }
        })
      }}
      placeholderText={"Search..."}
      onActivate={() => onEnter()}
      onNotifyText={(self) => {
        scrolled.set_vadjustment(null)
        text_set(self.text)
      }}
    />
  )
}

function Clear() {
  return (
    <button class={"clear"} focusable={false} onClicked={async () => await clipboard.clear()}>
      <image iconName={icons.trash.full} pixelSize={20} />
    </button>
  )
}

function Header() {
  return (
    <box class={"header"}>
      <Entry />
      <Clear />
    </box>
  )
}

function List() {
  return (
    <scrolledwindow class={"apps-list"} $={(self) => (scrolled = self)}>
      <box spacing={spacing} vexpand orientation={Gtk.Orientation.VERTICAL}>
        <For each={list}>
          {(item) => <ClipButton item={item} />}
        </For>
      </box>
    </scrolledwindow>
  )
}

function NotFound() {
  return (
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      vexpand
      class={"apps-not-found"}
      visible={list.as((l) => l.length === 0)}
    >
      <label label={"No matches found"} />
    </box>
  )
}

function Clipboard(_props: BarModuleProps) {
  return (
    <menubutton visible={true} hexpand={false} halign={Gtk.Align.CENTER}>
      <box>
        <image iconName={icons.ui.link} halign={Gtk.Align.CENTER} />
        <label label={"clipboard"} xalign={0.5} halign={Gtk.Align.CENTER} />
      </box>
      <popover>
        <box
          widthRequest={launcherWidth - windowPadding * 2}
          orientation={Gtk.Orientation.VERTICAL}
          vexpand
          spacing={spacing}
        >
          <Header />
          <NotFound />
          <List />
        </box>
      </popover>
    </menubutton>
  )
}

export default Clipboard
