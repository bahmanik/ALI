import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { For, createRoot, createState, onCleanup } from "gnim";
import type { Accessor } from "gnim";

import options from "src/configuration";
import icons from "src/lib/icons/icons";
import CountdownService, { type CountdownUiSlide } from "src/service/countdown";
import { formatRemaining, toGtkStackTransition } from "./helper";

type StackPage = { name: string; slide: CountdownUiSlide };

function fileUri(path: string): string {
  try {
    return Gio.File.new_for_path(path).get_uri();
  } catch {
    return path;
  }
}

function slideName(s: CountdownUiSlide): string {
  const key = encodeURIComponent(`${s.countdownId}::${s.occKey}`);
  return `cd:${key}`;
}

function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(len - 1, i));
}

function SlideCard(props: { slide: CountdownUiSlide; nowMs: Accessor<number> }): JSX.Element {
  const s = props.slide;
  const cssBg = s.imagePath ? `background-image: url("${fileUri(s.imagePath)}");` : "";

  return (
    <box class="countdown-slide countdown-image" css={cssBg} hexpand vexpand>
      <box vexpand />

      <box class="countdown-overlay" orientation={Gtk.Orientation.VERTICAL} hexpand>
        <label class="countdown-title" label={s.title} xalign={0} wrap />
        <label
          class="countdown-description"
          label={s.description ?? ""}
          visible={Boolean(s.description)}
          xalign={0}
          wrap
        />
        <label
          class="countdown-timer"
          label={props.nowMs.as((n) => formatRemaining(s.whenMs - n))}
          xalign={0}
          wrap
        />
      </box>
    </box>
  );
}

export default function CountdownView(): JSX.Element {
  const svc = CountdownService.getInstance();
  const cd = options.countdown; // crash if missing (as requested)

  const [slides, setSlides] = createState<StackPage[]>([]);
  const [idx, setIdx] = createState(0);

  let stackRef: Gtk.Stack | null = null;

  // IMPORTANT: to avoid rebuilding every tick, we memoize page keys.
  let lastKey = "";

  // Track/dispose per-child roots so cleanup works correctly.
  const disposeByName = new Map<string, () => void>();

  function disposeAll(): void {
    for (const d of disposeByName.values()) {
      try {
        d();
      } catch (e) {
        console.error("[CountdownView] dispose failed:", e);
      }
    }
    disposeByName.clear();
  }

  function mkWidget(factory: () => JSX.Element, name: string): Gtk.Widget {
    let dispose: (() => void) | undefined;

    const widget = createRoot((d) => {
      dispose = d;
      return factory() as unknown as Gtk.Widget;
    });

    if (dispose) disposeByName.set(name, dispose);
    return widget as unknown as Gtk.Widget;
  }

  function computePages(now: number): StackPage[] {
    const raw = svc.getUiSlides(now, cd.pastLimit.get());
    return raw.map((s) => ({ name: slideName(s), slide: s }));
  }

  function pagesKey(pages: StackPage[]): string {
    // stable identity of the stack; if this string doesn't change we do NOT rebuild
    return pages.map((p) => p.name).join("|");
  }

  function rebuildStack(pages: StackPage[]): void {
    const st = stackRef;
    if (!st) return;

    // nuke old widgets + dispose their roots
    disposeAll();

    try {
      let child = st.get_first_child();
      while (child) {
        const next = child.get_next_sibling();
        st.remove(child);
        child = next;
      }
    } catch (e) {
      console.error("[CountdownView] removing children failed:", e);
    }

    if (pages.length === 0) {
      const empty = mkWidget(
        () => (
          <box class="countdown-slide" hexpand vexpand>
            <label
              label="No countdowns"
              halign={Gtk.Align.CENTER}
              valign={Gtk.Align.CENTER}
              hexpand
              vexpand
            />
          </box>
        ),
        "empty",
      );
      st.add_named(empty, "empty");
      st.set_visible_child_name("empty");
      return;
    }

    for (const p of pages) {
      const w = mkWidget(() => <SlideCard slide={p.slide} nowMs={nowMs} />, p.name);
      st.add_named(w, p.name);
    }

    const i = clampIndex(idx.peek(), pages.length);
    setIdx(i);
    st.set_visible_child_name(pages[i]!.name);
  }

  function setVisibleByIdx(nextIdx: number): void {
    const st = stackRef;
    const pages = slides.peek();
    if (!st || pages.length === 0) return;

    const i = clampIndex(nextIdx, pages.length);
    setIdx(i);
    st.set_visible_child_name(pages[i]!.name);
  }

  const go = (delta: -1 | 1) => {
    const pages = slides.peek();
    const n = pages.length;
    if (n <= 1) return;

    const cur = ((idx.peek() % n) + n) % n;      // normalize
    const next = (cur + delta + n) % n;          // wrap
    setVisibleByIdx(next);
  };

  // ONE clock only: returns nowMs AND (cheaply) updates slide list when it actually changes.
  const nowMs = createPoll(0, cd.refreshMs.get(), () => {
    const now = GLib.DateTime.new_now_utc().to_unix() * 1000;

    const pages = computePages(now);
    const k = pagesKey(pages);

    if (k !== lastKey) {
      lastKey = k;
      setSlides(pages); // triggers rebuild via slides.subscribe below
    }

    return now;
  });

  // Rebuild stack only when slide array changes (not every tick).
  const unsubSlides = slides.subscribe(() => rebuildStack(slides.peek()));
  onCleanup(() => {
    unsubSlides();
    disposeAll();
  });

  return (
    <box class="countdown-root" orientation={Gtk.Orientation.VERTICAL}>
      <box class="countdown-nav" orientation={Gtk.Orientation.HORIZONTAL}>
        <button class="countdown-nav-btn" onClicked={() => go(-1)} tooltipText="Previous">
          <image iconName={icons.ui.arrow.left} />
        </button>

        <box hexpand halign={Gtk.Align.CENTER}>
          <For each={slides}>
            {(p: StackPage, i: Accessor<number>) => (
              <button
                class={idx.as((n) => (n === i() ? "countdown-nav-btn active" : "countdown-nav-btn"))}
                tooltipText={p.slide.title}
                onClicked={() => setVisibleByIdx(i())}
              >
                <label class="countdown-nav-label" label={idx.as((n) => (n === i() ? "●" : "○"))} />
              </button>
            )}
          </For>
        </box>

        <button class="countdown-nav-btn" onClicked={() => go(1)} tooltipText="Next">
          <image iconName={icons.ui.arrow.right} />
        </button>
      </box>

      <stack
        hexpand
        vexpand
        transitionType={cd.stack.transition.as(toGtkStackTransition)}
        transitionDuration={cd.stack.duration.as((d) => Math.max(0, d))}
        $={(st: Gtk.Stack) => {
          stackRef = st;

          // initial population (without waiting for poll tick)
          const init = Date.now();
          const pages = computePages(init);
          lastKey = pagesKey(pages);
          setSlides(pages);
        }}
      />
    </box>
  );
}
