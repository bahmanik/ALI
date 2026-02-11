import { Astal, Gdk, Gtk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { createState } from "ags"
import Graphene from "gi://Graphene?version=1.0"
import Adw from "gi://Adw?version=1"
import { timeout } from "ags/time"

const hide_all_windows = () => app.get_window("applauncher")?.hide()

type PopupProps = JSX.IntrinsicElements["window"] & {
   children?: any
   width?: number
   height?: number
   gdkmonitor?: Gdk.Monitor
   transitionType?: Gtk.RevealerTransitionType
   transitionDuration?: number
   open?: boolean
}

export function Popup({
   children,
   name,
   width,
   height,
   gdkmonitor,
   transitionType = Gtk.RevealerTransitionType.SLIDE_DOWN,
   transitionDuration = 1,
   halign = Gtk.Align.CENTER,
   valign = Gtk.Align.CENTER,
   open,
   ...props
}: PopupProps) {
   const { TOP, BOTTOM, RIGHT, LEFT } = Astal.WindowAnchor

   let contentbox: Adw.Clamp | null = null

   const [visible, setVisible] = createState(Boolean(open))
   const [revealed, setRevealed] = createState(Boolean(open))

   function show() {
      setVisible(true)
      timeout(1, () => setRevealed(true))
   }

   function hide() {
      setRevealed(false)

      // hide the window AFTER the slide-out finishes
      timeout(Math.max(0, transitionDuration * 1000), () => {
         setVisible(false)
      })
   }

   function onNotifyVisible({ visible: v }: { visible: boolean }) {
      if (v) {
         setVisible(true)
         timeout(1, () => setRevealed(true))
         contentbox?.grab_focus()
      }
   }

   function init(self: Gtk.Window) {
      // override existing show and hide methods
      Object.assign(self, { show, hide })
   }

   return (
      <window
         {...props}
         visible={visible}
         name={name}
         namespace={name}
         class="PopupWindow"
         decorated={false}
         keymode={Astal.Keymode.ON_DEMAND}
         layer={Astal.Layer.OVERLAY}
         gdkmonitor={gdkmonitor}
         anchor={TOP | BOTTOM | RIGHT | LEFT}
         application={app}
         $={init}
         onNotifyVisible={onNotifyVisible}
      >
         <Gtk.EventControllerKey
            onKeyPressed={({ widget }, keyval: number) => {
               if (keyval === Gdk.KEY_Escape) {
                  widget.hide()
               }
            }}
         />
         <Gtk.GestureClick
            onPressed={({ widget }, _, x, y) => {
               const [, rect] = children.compute_bounds(widget)
               const position = new Graphene.Point({ x, y })
               console.log(rect.get_width(), rect.get_height())

               if (!rect.contains_point(position)) {
                  hide_all_windows()
               }
            }}
         />
         <revealer
            transitionType={transitionType}
            transitionDuration={transitionDuration * 1000}
            revealChild={revealed}
            halign={halign}
            valign={valign}
         >
            <Adw.Clamp
               $={(self) => (contentbox = self)}
               focusable
               maximum_size={width}
               heightRequest={height}
            >
               <box class={"main"}>{children}</box>
            </Adw.Clamp>
         </revealer>
      </window>
   )
}
