import app from "ags/gtk4/app"
import Graphene from "gi://Graphene?version=1.0"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { createState } from "ags"
import { timeout } from "ags/time"
import { calculateAnchor, layoutToAlign, type PopupLayout } from "../helpers"

type PopupProps = JSX.IntrinsicElements["window"] & {
   children?: any

   /** Optional size caps for the popup surface (not the fullscreen input layer). */
   width?: number
   height?: number

   gdkmonitor?: Gdk.Monitor

   transitionType?: Gtk.RevealerTransitionType
   /** Seconds (kept for backward compat with your settings). */
   transitionDuration?: number

   /** Initial state only. */
   open?: boolean

   /** layout name -> window anchor. */
   layout?: PopupLayout | string

   /** Extra classes applied to the popup surface (the thing with the shadow). */
   surfaceClass?: string
}

/**
 * Epik-style popup wrapper.
 * - Keeps your reveal animation + (visible/revealed) state machine.
 * - Uses Epik's click-outside-to-close logic.
 * - Positions via `anchor` (or `layout`) instead of halign/valign.
 */
export function Popup({
   children,
   name,
   width,
   height,
   gdkmonitor,
   transitionType = Gtk.RevealerTransitionType.SWING_DOWN,
   transitionDuration = 0.1,
   open,
   layout = "center",
   class: extraClass,
   surfaceClass,
   ...props
}: PopupProps) {
   let surface: Gtk.Widget | null = null
   let syncing = false

   // Two-phase visibility: window must stay visible while revealer animates out.
   const [visible, setVisible] = createState(Boolean(open))
   const [revealed, setRevealed] = createState(Boolean(open))

   function show() {
      if (syncing) return
      setVisible(true)
      timeout(1, () => setRevealed(true))
   }

   function hide() {
      if (syncing) return
      setRevealed(false)
      timeout(Math.max(0, transitionDuration * 1000), () => setVisible(false))
   }

   function init(self: Gtk.Window) {
      // Make sure callers (and `ags toggle`) hit animation-aware methods.
      Object.assign(self, { show, hide })
   }

   function onNotifyVisible(win: Astal.Window) {
      // External show (e.g. `ags toggle applauncher`) -> start animation.
      if (win.visible) {
         setVisible(true)
         timeout(1, () => setRevealed(true))
         surface?.grab_focus?.()
         return
      }

      // Best-effort: if something hides the window directly (instead of calling `hide()`),
      // re-show it long enough to run the slide-out, then fully hide it.
      const isInternallyVisible = visible.peek?.() ?? false
      const isRevealed = revealed.peek?.() ?? false
      if (isInternallyVisible && isRevealed) {
         syncing = true
         setVisible(true)
         timeout(1, () => {
            syncing = false
            hide()
         })
      }
   }

   const winClass = ["PopupWindow", extraClass].filter(Boolean).join(" ")
   const surfaceClasses = ["window-content", surfaceClass].filter(Boolean).join(" ")

   // Don't clobber anchor if caller provides one.
   const anchor = (props as any).anchor ?? calculateAnchor(layout)

   const { halign, valign } = layoutToAlign(layout)
   return (
      <window
         {...props}
         visible={visible}
         name={name}
         namespace={name}
         class={winClass}
         decorated={false}
         keymode={Astal.Keymode.EXCLUSIVE}
         layer={Astal.Layer.OVERLAY}
         gdkmonitor={gdkmonitor}
         anchor={anchor}
         application={app}
         $={init}
         onNotifyVisible={onNotifyVisible}
      >
         <Gtk.EventControllerKey
            onKeyPressed={({ widget }, keyval: number) => {
               if (keyval === Gdk.KEY_Escape) widget.hide()
            }}
         />

         {/* Epik-style: click anywhere outside the popup surface to close */}
         <Gtk.GestureClick
            onReleased={({ widget: win }, _n, x, y) => {
               if (!surface) return false

               const res = surface.compute_bounds(win)
               const rect = res?.[1]
               if (!rect) return false

               const position = new Graphene.Point({ x, y })
               if (!rect.contains_point(position)) {
                  win.hide()
                  return true
               }

               return false
            }}
         />
         <revealer
            transitionType={transitionType}
            transitionDuration={transitionDuration * 1000}
            revealChild={revealed}
            valign={valign}
            halign={halign}
         >
            <box
               $={(self) => (surface = self)}
               class={surfaceClasses}
               focusable
               widthRequest={width}
               heightRequest={height}
            >
               {children}
            </box>
         </revealer>
      </window>
   )
}
