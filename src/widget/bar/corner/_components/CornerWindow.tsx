import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import type { Gdk, Gtk } from "ags/gtk4";

export type CornerWindowProps = {
  monitorId: string;
  gdkmonitor: Gdk.Monitor;
  visible: any;
  onWindow: (win: Astal.Window) => void;
  onNotifyVisible: (visible: boolean) => void;
  onArea: (da: Gtk.DrawingArea) => void;
};

export default function CornerWindow({
  monitorId,
  gdkmonitor,
  visible,
  onWindow,
  onNotifyVisible,
  onArea,
}: CornerWindowProps) {
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  return (
    <window
      name={`corner-${monitorId}`}
      application={app}
      gdkmonitor={gdkmonitor}
      visible={visible}
      layer={Astal.Layer.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      css="background: transparent;"
      $={(self) => {
        onWindow(self);
      }}
      onNotifyVisible={({ visible }) => {
        onNotifyVisible(Boolean(visible));
      }}
    >
      <drawingarea
        hexpand
        vexpand
        canFocus={false}
        sensitive={false}
        $={(self: Gtk.DrawingArea) => {
          onArea(self);
        }}
      />
    </window>
  );
}
