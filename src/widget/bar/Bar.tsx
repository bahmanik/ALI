import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalWp from "gi://AstalWp"
import AstalNetwork from "gi://AstalNetwork"
import AstalTray from "gi://AstalTray"
import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { For, With, createBinding, onCleanup } from "ags"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"
import { getBarPos } from "./helper"
import { setPrimaryRect, setSecondaryRect } from "./geometry"
import type { BarLocation } from "src/lib/options/types"

type BarOptionGroup = {
  position: { get(): BarLocation; subscribe(cb: () => void): any; as?: any };
  margin: { get(): number[]; subscribe(cb: () => void): any; as?: any };
};

type BarProps = {
  gdkmonitor: Gdk.Monitor;
  name: string;
  option: BarOptionGroup;
  /** Defaults to "bar" */
  namespace?: string;
  /** Used for geometry bookkeeping */
  kind?: "primary" | "secondary";
};

function Mpris() {
  const mpris = AstalMpris.get_default()
  const apps = new AstalApps.Apps()
  const players = createBinding(mpris, "players")

  return (
    <menubutton>
      <box>
        <For each={players}>
          {(player) => {
            const [app] = apps.exact_query(player.entry)
            return <image visible={!!app.iconName} iconName={app?.iconName} />
          }}
        </For>
      </box>
      <popover>
        <box spacing={4} orientation={Gtk.Orientation.VERTICAL}>
          <For each={players}>
            {(player) => (
              <box spacing={4} widthRequest={200}>
                <box overflow={Gtk.Overflow.HIDDEN} css="border-radius: 8px;">
                  <image
                    pixelSize={64}
                    file={createBinding(player, "coverArt")}
                  />
                </box>
                <box
                  valign={Gtk.Align.CENTER}
                  orientation={Gtk.Orientation.VERTICAL}
                >
                  <label xalign={0} label={createBinding(player, "title")} />
                  <label xalign={0} label={createBinding(player, "artist")} />
                </box>
                <box hexpand halign={Gtk.Align.END}>
                  <button
                    onClicked={() => player.previous()}
                    visible={createBinding(player, "canGoPrevious")}
                  >
                    <image iconName="media-seek-backward-symbolic" />
                  </button>
                  <button
                    onClicked={() => player.play_pause()}
                    visible={createBinding(player, "canControl")}
                  >
                    <box>
                      <image
                        iconName="media-playback-start-symbolic"
                        visible={createBinding(
                          player,
                          "playbackStatus",
                        )((s) => s === AstalMpris.PlaybackStatus.PLAYING)}
                      />
                      <image
                        iconName="media-playback-pause-symbolic"
                        visible={createBinding(
                          player,
                          "playbackStatus",
                        )((s) => s !== AstalMpris.PlaybackStatus.PLAYING)}
                      />
                    </box>
                  </button>
                  <button
                    onClicked={() => player.next()}
                    visible={createBinding(player, "canGoNext")}
                  >
                    <image iconName="media-seek-forward-symbolic" />
                  </button>
                </box>
              </box>
            )}
          </For>
        </box>
      </popover>
    </menubutton>
  )
}

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box>
      <For each={items}>
        {(item) => (
          <menubutton $={(self) => init(self, item)}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}

function Wireless() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
    return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
  }

  async function connect(ap: AstalNetwork.AccessPoint) {
    // connecting to ap is not yet supported
    // https://github.com/Aylur/astal/pull/13
    try {
      await execAsync(`nmcli d wifi connect ${ap.bssid}`)
    } catch (error) {
      // you can implement a popup asking for password here
      console.error(error)
    }
  }

  return (
    <box visible={wifi(Boolean)}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
            <menubutton>
              <image iconName={createBinding(wifi, "iconName")} />
              <popover>
                <box orientation={Gtk.Orientation.VERTICAL}>
                  <For each={createBinding(wifi, "accessPoints")(sorted)}>
                    {(ap: AstalNetwork.AccessPoint) => (
                      <button onClicked={() => connect(ap)}>
                        <box spacing={4}>
                          <image iconName={createBinding(ap, "iconName")} />
                          <label label={createBinding(ap, "ssid")} />
                          <image
                            iconName="object-select-symbolic"
                            visible={createBinding(
                              wifi,
                              "activeAccessPoint",
                            )((active) => active === ap)}
                          />
                        </box>
                      </button>
                    )}
                  </For>
                </box>
              </popover>
            </menubutton>
          )
        }
      </With>
    </box>
  )
}

function AudioOutput() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <menubutton>
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <popover>
        <box>
          <slider
            widthRequest={260}
            onChangeValue={({ value }) => speaker.set_volume(value)}
            value={createBinding(speaker, "volume")}
          />
        </box>
      </popover>
    </menubutton>
  )
}

function Battery() {
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()

  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`)

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  return (
    <menubutton visible={createBinding(battery, "isPresent")}>
      <box>
        <image iconName={createBinding(battery, "iconName")} />
        <label label={percent} />
      </box>
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL}>
          {powerprofiles.get_profiles().map(({ profile }) => (
            <button onClicked={() => setProfile(profile)}>
              <label label={profile} xalign={0} />
            </button>
          ))}
        </box>
      </popover>
    </menubutton>
  )
}

function Clock({ format = "%H:%M" }) {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  return <button label={time} />
}

export default function Bar({ gdkmonitor, name, option, namespace = "bar", kind = "primary" }: BarProps) {
  let win: Astal.Window
  let root: Gtk.Widget | null = null

  const monitorId = gdkmonitor.connector

  const getMargin = () => {
    const m = option.margin.get?.() ?? [0, 0, 0, 0]
    const [top, right, bottom, left] = Array.isArray(m) ? (m as number[]) : [0, 0, 0, 0]
    return { top: top ?? 0, right: right ?? 0, bottom: bottom ?? 0, left: left ?? 0 }
  }

  const computeAndStoreRect = () => {
    if (!win) return
    const geo = gdkmonitor.get_geometry()
    const mw = geo.width
    const mh = geo.height

    const pos = option.position.get?.() as BarLocation
    const { top, right, bottom, left } = getMargin()

    const aw = root?.get_allocated_width?.() ?? 0
    const ah = root?.get_allocated_height?.() ?? 0

    // Astal stretches the window across anchored edges. Use allocation + monitor geometry for a stable rect.
    let x = left
    let y = top
    let width = aw
    let height = ah

    if (pos === "top") {
      x = left
      y = top
      width = mw - left - right
      height = ah
    } else if (pos === "bottom") {
      x = left
      width = mw - left - right
      height = ah
      y = mh - bottom - height
    } else if (pos === "left") {
      x = left
      y = top
      width = aw
      height = mh - top - bottom
    } else if (pos === "right") {
      width = aw
      height = mh - top - bottom
      x = mw - right - width
      y = top
    }

    const rect = { monitor: monitorId, name, position: pos, x, y, width: Math.max(0, width), height: Math.max(0, height) }
    if (kind === "primary") setPrimaryRect(monitorId, rect)
    else setSecondaryRect(monitorId, rect)
  }

  onCleanup(() => {
    // Root components (windows) are not automatically destroyed.
    // When the monitor is disconnected from the system, this callback
    // is run from the parent <For> which allows us to destroy the window
    win.destroy()

    // Clear only the rect that belongs to this bar.
    if (kind === "primary") setPrimaryRect(monitorId, undefined)
    else setSecondaryRect(monitorId, undefined)
  })

  return (
    <window
      $={(self) => {
        win = self

        const unsubPos = option.position.subscribe?.(computeAndStoreRect)
        const unsubMargin = option.margin.subscribe?.(computeAndStoreRect)

        // initial
        computeAndStoreRect()

        onCleanup(() => {
          try { unsubPos?.() } catch { }
          try { unsubMargin?.() } catch { }
        })
      }}
      visible
      namespace={namespace}
      name={name}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={option.position.as ? option.position.as((a: BarLocation) => getBarPos(a)) : getBarPos(option.position.get())}
      marginTop={option.margin.as ? option.margin.as((m: number[]) => (m?.[0] ?? 0)) : getMargin().top}
      marginRight={option.margin.as ? option.margin.as((m: number[]) => (m?.[1] ?? 0)) : getMargin().right}
      marginBottom={option.margin.as ? option.margin.as((m: number[]) => (m?.[2] ?? 0)) : getMargin().bottom}
      marginLeft={option.margin.as ? option.margin.as((m: number[]) => (m?.[3] ?? 0)) : getMargin().left}
      application={app}
      css="background: transparent;"
    >
      <centerbox
        $={(self) => {
          root = self

          // GTK4 removed the ::size-allocate signal. The recommended way to observe widget
          // size changes is via GtkWidgetPaintable, which emits GdkPaintable::invalidate-size
          // when the observed widget's size changes. This is event-like (not per-frame polling).
          // https://docs.gtk.org/gtk4/class.WidgetPaintable.html
          let paintable: Gtk.WidgetPaintable | null = null
          let paintableHid = 0

          try {
            // GI bindings can expose this as either a static .new(widget) constructor
            // or as a normal JS constructor with a { widget } property.
            // We attempt both.
            // @ts-ignore
            paintable = Gtk.WidgetPaintable.new?.(self) ?? new Gtk.WidgetPaintable({ widget: self })

            paintableHid = paintable.connect("invalidate-size", () => {
              console.log("fired by invalidate-size")
              computeAndStoreRect()
            })
          } catch (e) {
            console.log("this is using poll fallback")
            // Fallback: if WidgetPaintable isn't available in this binding stack for some reason,
            // we fall back to a lightweight poll on frames. Still guarded by width/height checks.
            let lastW = -1
            let lastH = -1
            const tickId = self.add_tick_callback(() => {
              const w = self.get_width?.() ?? 0
              const h = self.get_height?.() ?? 0
              if (w !== lastW || h !== lastH) {
                lastW = w
                lastH = h
                computeAndStoreRect()
              }
              return true
            })
            onCleanup(() => {
              try { self.remove_tick_callback(tickId) } catch { }
            })
          }

          // initial attempt (may still be 0x0 before first layout)
          computeAndStoreRect()

          onCleanup(() => {
            try {
              if (paintable && paintableHid) paintable.disconnect(paintableHid)
            } catch { }
            paintable = null
          })
        }}
        css={`background: rgba(0,0,0,0.25); border-radius: 16px; padding: 6px 12px;`}>
        <box $type="start">
          <Clock />
          <Mpris />
        </box>
        <box $type="end">
          <Tray />
          <Wireless />
          <AudioOutput />
          <Battery />
        </box>
      </centerbox>
    </window>
  )
}
