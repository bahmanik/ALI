import { Astal, Gdk, Gtk } from "ags/gtk4"
import { With } from "ags"
import { createState } from "gnim"
import options from "src/configuration"
import { getMenuOpt } from "src/widget/shared/menus/getMenuOpt"
import { ClockMenu } from "src/widget/shared/menus/clockMenu"
import type { NodeId } from "src/widget/shared/menus/types"
import GLib from "gi://GLib?version=2.0"

// ─── Test NodeIds — must match what you added to barDefaultLayout ─────────────

const NODE_A = "test_aaa" as NodeId
const NODE_B = "test_bbb" as NodeId

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <Gtk.Separator
      orientation={Gtk.Orientation.HORIZONTAL}
      css="margin: 4px 0; opacity: 0.3;"
    />
  )
}

// ─── Opt ID inspector ─────────────────────────────────────────────────────────
// Verifies the OptionRegistry assigned proper dot-path ids to every Opt.
// Empty id = Opt was not collected by the registry = bug.

function OptInspectorRow({ label, id }: { label: string; id: string }) {
  const ok = id.length > 0
  return (
    <box spacing={8} valign={Gtk.Align.CENTER}>
      <label
        label={label}
        widthRequest={200}
        halign={Gtk.Align.END}
        css="font-size: 11px; opacity: 0.6;"
      />
      <label
        label={ok ? id : "EMPTY — not registered!"}
        halign={Gtk.Align.START}
        selectable={true}
        css={`font-family: monospace; font-size: 11px; color: ${ok ? "green" : "red"};`}
      />
    </box>
  )
}

function OptInspector() {
  const gf  = options.menuDefaults.Clock.format
  const gs  = options.menuDefaults.Clock.showSeconds
  const af  = getMenuOpt(NODE_A, "Clock", "format")
  const as_ = getMenuOpt(NODE_A, "Clock", "showSeconds")
  const bf  = getMenuOpt(NODE_B, "Clock", "format")
  const bs  = getMenuOpt(NODE_B, "Clock", "showSeconds")

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
      css="background: alpha(@surface, 0.5); padding: 12px; border-radius: 8px;"
    >
      <label label="Opt ID Inspector" halign={Gtk.Align.START} css="font-weight: bold; margin-bottom: 4px;" />
      <OptInspectorRow label="menuDefaults.Clock.format"          id={gf.id}  />
      <OptInspectorRow label="menuDefaults.Clock.showSeconds"     id={gs.id}  />
      <OptInspectorRow label="instances.test_aaa.format"          id={af.id}  />
      <OptInspectorRow label="instances.test_aaa.showSeconds"     id={as_.id} />
      <OptInspectorRow label="instances.test_bbb.format"          id={bf.id}  />
      <OptInspectorRow label="instances.test_bbb.showSeconds"     id={bs.id}  />
    </box>
  )
}

// ─── Global defaults panel ────────────────────────────────────────────────────

function GlobalDefaultsPanel() {
  const formatOpt = options.menuDefaults.Clock.format
  const secOpt    = options.menuDefaults.Clock.showSeconds
  const [draft, setDraft] = createState(formatOpt.get())

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={8}
      css="background: alpha(@purple, 0.08); padding: 12px; border-radius: 8px; border: 1px solid alpha(@purple, 0.3);"
    >
      <label
        label="Global Default  (options.menuDefaults.Clock.*)"
        halign={Gtk.Align.START}
        css="font-weight: bold; color: @purple;"
      />
      <label
        label="Changing this does NOT reactively update A or B — they have independent Opts."
        css="font-size: 10px; opacity: 0.6;"
        halign={Gtk.Align.START}
        wrap={true}
      />

      <Divider />

      {/* format */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="format" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <entry
          text={draft}
          hexpand
          onNotifyText={(self) => setDraft(self.text)}
          onActivate={(self) => {
            formatOpt.set(self.text)
            console.log(`[MenuConfigTest] global.format → "${self.text}"`)
          }}
          tooltipText="Press Enter to apply"
        />
        <With value={formatOpt.as((v: string) => v)}>
          {(v: string) => (
            <label label={`= "${v}"`} css="font-family: monospace; font-size: 11px; opacity: 0.7;" />
          )}
        </With>
        <button onClicked={() => { formatOpt.reset(); setDraft(formatOpt.get()) }}>
          <label label="↺" />
        </button>
      </box>

      {/* showSeconds */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="showSeconds" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <With value={secOpt.as((v: boolean) => v)}>
          {(v: boolean) => (
            <switch
              active={v}
              onStateFlagsChanged={(self) => {
                if (secOpt.get() !== self.active) {
                  secOpt.set(self.active)
                  console.log(`[MenuConfigTest] global.showSeconds → ${self.active}`)
                }
              }}
            />
          )}
        </With>
      </box>
    </box>
  )
}

// ─── Per-instance panel ───────────────────────────────────────────────────────

function InstancePanel({
  nodeId,
  title,
  color,
}: {
  nodeId: NodeId
  title:  string
  color:  string
}) {
  const formatOpt = getMenuOpt(nodeId, "Clock", "format")
  const secOpt    = getMenuOpt(nodeId, "Clock", "showSeconds")
  const [draft, setDraft] = createState(formatOpt.get())

  // Inline clock using opt.as directly — isolates just the reactive accessor
  // path, separate from the full ClockMenu component render path below.
  const liveTime = formatOpt.as((fmt: string) => {
    const now = GLib.DateTime.new_now_local()
    return now.format(fmt) ?? "???"
  })

  const inStaticTree = formatOpt.id.length > 0

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={8}
      css={`background: alpha(${color}, 0.08); padding: 12px; border-radius: 8px; border: 1px solid alpha(${color}, 0.3);`}
    >
      {/* Header */}
      <box spacing={8}>
        <label label={title} css={`font-weight: bold; color: ${color};`} />
        <label
          label={`nodeId = "${nodeId}"`}
          css="font-family: monospace; font-size: 11px; opacity: 0.6;"
        />
        {!inStaticTree && (
          <label
            label="⚠ fallback to global"
            css="font-size: 10px; color: orange;"
            tooltipText="NodeId not pre-seeded — per-instance persistence needs a restart"
          />
        )}
      </box>

      <Divider />

      {/* Live clock from opt.as — tests reactive accessor directly */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="live clock" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <With value={liveTime}>
          {(t: string) => (
            <label label={t} css={`font-family: monospace; font-size: 22px; color: ${color};`} />
          )}
        </With>
        <label label="(via opt.as)" css="font-size: 10px; opacity: 0.5;" />
      </box>

      {/* ClockMenu component — tests the full render path end-to-end */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="ClockMenu" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <box css="background: alpha(@surface, 0.5); padding: 6px 12px; border-radius: 6px;">
          <ClockMenu nodeId={nodeId} />
        </box>
        <label label="(via component)" css="font-size: 10px; opacity: 0.5;" />
      </box>

      <Divider />

      {/* format control */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="format" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <entry
          text={draft}
          hexpand
          onNotifyText={(self) => setDraft(self.text)}
          onActivate={(self) => {
            formatOpt.set(self.text)
            console.log(`[MenuConfigTest] ${nodeId}.format → "${self.text}"`)
          }}
          tooltipText="Press Enter — watch that the OTHER instance does NOT update"
        />
        <button onClicked={() => { formatOpt.reset(); setDraft(formatOpt.get()) }}>
          <label label="↺" />
        </button>
      </box>

      {/* showSeconds control */}
      <box spacing={8} valign={Gtk.Align.CENTER}>
        <label label="showSeconds" widthRequest={100} halign={Gtk.Align.END} css="opacity:0.7;" />
        <With value={secOpt.as((v: boolean) => v)}>
          {(v: boolean) => (
            <box spacing={8}>
              <switch
                active={v}
                onStateFlagsChanged={(self) => {
                  if (secOpt.get() !== self.active) {
                    secOpt.set(self.active)
                    console.log(`[MenuConfigTest] ${nodeId}.showSeconds → ${self.active}`)
                  }
                }}
              />
              <label
                label={v ? "true" : "false"}
                css="font-family: monospace; opacity: 0.7;"
              />
            </box>
          )}
        </With>
      </box>

      {/* Opt id proof */}
      <box spacing={8}>
        <label label="opt id" widthRequest={100} halign={Gtk.Align.END} css="font-size:10px; opacity:0.5;" />
        <label
          label={formatOpt.id || "EMPTY"}
          selectable={true}
          css={`font-family: monospace; font-size: 10px; color: ${inStaticTree ? "green" : "orange"};`}
        />
      </box>
    </box>
  )
}

// ─── Reset strip ──────────────────────────────────────────────────────────────

function ResetStrip() {
  const resetAll = () => {
    options.menuDefaults.Clock.format.reset()
    options.menuDefaults.Clock.showSeconds.reset()
    getMenuOpt(NODE_A, "Clock", "format").reset()
    getMenuOpt(NODE_A, "Clock", "showSeconds").reset()
    getMenuOpt(NODE_B, "Clock", "format").reset()
    getMenuOpt(NODE_B, "Clock", "showSeconds").reset()
    console.log("[MenuConfigTest] all test opts reset")
  }

  return (
    <box spacing={16} halign={Gtk.Align.CENTER}>
      <button
        onClicked={resetAll}
        css="background: alpha(@red, 0.12); padding: 6px 20px; border-radius: 6px; border: 1px solid alpha(@red, 0.4);"
      >
        <label label="Reset all test opts" css="color: @red;" />
      </button>
      <label
        label="(writes initial values back to disk)"
        css="font-size: 10px; opacity: 0.5;"
      />
    </box>
  )
}

// ─── Root window ──────────────────────────────────────────────────────────────

function MenuConfigTestWindow(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      name="menu-config-test"
      namespace="MenuConfigTest"
      cssClasses={["test"]}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.ON_DEMAND}
      visible={true}
      anchor={
        Astal.WindowAnchor.TOP    |
        Astal.WindowAnchor.BOTTOM |
        Astal.WindowAnchor.LEFT   |
        Astal.WindowAnchor.RIGHT
      }
    >
      <Gtk.ScrolledWindow hexpand vexpand>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={16}
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.START}
          css="padding: 32px; min-width: 640px; max-width: 720px;"
        >
          <label
            label="Menu Config System — Integration Test"
            css="font-size: 18px; font-weight: bold;"
            halign={Gtk.Align.CENTER}
          />

          <OptInspector />
          <GlobalDefaultsPanel />
          <InstancePanel nodeId={NODE_A} title="Instance A" color="@green"  />
          <InstancePanel nodeId={NODE_B} title="Instance B" color="@orange" />
          <ResetStrip />
        </box>
      </Gtk.ScrolledWindow>
    </window>
  )
}

export default MenuConfigTestWindow
