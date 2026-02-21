import { Gtk } from "ags/gtk4";

export type OsdCardProps = {
  title: any;
  iconName: any;
  percent: any;
  value: any;
  percentClass: any;
  levelClass: any;
  gap: any;

  isInteractive: () => boolean;
  isAcceptingInput: () => boolean;

  onSurface: (w: Gtk.Widget) => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;

  applyNormalized: (n: number) => void;
};

export default function OsdCard({
  title,
  iconName,
  percent,
  value,
  percentClass,
  levelClass,
  gap,
  isInteractive,
  isAcceptingInput,
  onSurface,
  onHoverEnter,
  onHoverLeave,
  onDragStart,
  onDragEnd,
  applyNormalized,
}: OsdCardProps) {
  return (
    <box
      class="osd-surface"
      orientation={Gtk.Orientation.VERTICAL}
      $={(w: Gtk.Widget) => {
        onSurface(w);

        // hover pause (interactive only). this works because we accept input while visible.
        const motion = new Gtk.EventControllerMotion();
        motion.connect("enter", () => {
          if (!isInteractive()) return;
          onHoverEnter();
        });
        motion.connect("leave", () => {
          onHoverLeave();
        });
        w.add_controller(motion);
      }}
    >
      <box class="osd-header" hexpand>
        <label class="osd-title" label={title} hexpand xalign={0} />
        <label class={percentClass} label={percent.as((p: any) => `${Math.round(Number(p) || 0)}%`)} xalign={1} />
      </box>

      <box class="osd-body" orientation={Gtk.Orientation.HORIZONTAL} spacing={gap}>
        <box class="osd-icon" hexpand={false} vexpand={false}>
          <image iconName={iconName} />
        </box>

        <levelbar
          class={levelClass}
          value={value}
          minValue={0}
          maxValue={1}
          orientation={Gtk.Orientation.HORIZONTAL}
          inverted={false}
          hexpand
          vexpand
          $={(bar: any) => {
            const click = new Gtk.GestureClick({ button: 0, exclusive: false });
            try {
              (click as any).propagationPhase = Gtk.PropagationPhase.CAPTURE;
            } catch {
              // ignore
            }

            click.connect("pressed", (_g: any, _n: number, x: number) => {
              if (!isAcceptingInput()) return;
              const w = Math.max(1, bar.get_allocated_width?.() ?? 1);
              onDragStart();
              applyNormalized(x / w);
            });

            const end = () => {
              onDragEnd();
            };

            click.connect("released", end);
            click.connect("stopped", end);
            bar.add_controller(click);

            const drag = new Gtk.GestureDrag({ button: 0, exclusive: false });
            try {
              (drag as any).propagationPhase = Gtk.PropagationPhase.CAPTURE;
            } catch {
              // ignore
            }

            let startX = 0;
            let width = 1;

            drag.connect("drag-begin", (_g: any, x: number) => {
              if (!isAcceptingInput()) return;
              onDragStart();
              startX = x;
              width = Math.max(1, bar.get_allocated_width?.() ?? 1);
              applyNormalized(startX / width);
            });

            drag.connect("drag-update", (_g: any, dx: number) => {
              if (!isAcceptingInput()) return;
              applyNormalized((startX + dx) / width);
            });

            drag.connect("drag-end", end);

            bar.add_controller(drag);
          }}
        />
      </box>
    </box>
  );
}
