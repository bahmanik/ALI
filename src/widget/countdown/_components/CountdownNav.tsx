import type { Accessor } from 'gnim'
import type { CountdownUiSlide } from 'src/services/countdown'

import { For } from 'gnim'
import { Gtk } from 'ags/gtk4'

import icons from 'src/lib/icons/icons'

type NavPage = { slide: CountdownUiSlide }

type Signal<T> = Accessor<T> & {
  as: <U>(f: (v: T) => U) => Accessor<U>
}

export type CountdownNavProps = {
  slides: Accessor<NavPage[]>
  idx: Signal<number>
  onPrev: () => void
  onNext: () => void
  onSelect: (i: number) => void
}

export default function CountdownNav({ slides, idx, onPrev, onNext, onSelect }: CountdownNavProps): JSX.Element {
  return (
    <box class="countdown-nav" orientation={Gtk.Orientation.HORIZONTAL}>
      <button class="countdown-nav-btn" onClicked={onPrev} tooltipText="Previous">
        <image iconName={icons.ui.arrow.left} />
      </button>

      <box hexpand halign={Gtk.Align.CENTER}>
        <For each={slides}>
          {(p: NavPage, i: Accessor<number>) => (
            <button
              class={idx.as((n) => (n === i() ? 'countdown-nav-btn active' : 'countdown-nav-btn'))}
              tooltipText={p.slide.title}
              onClicked={() => onSelect(i())}
            >
              <label class="countdown-nav-label" label={idx.as((n) => (n === i() ? '●' : '○'))} />
            </button>
          )}
        </For>
      </box>

      <button class="countdown-nav-btn" onClicked={onNext} tooltipText="Next">
        <image iconName={icons.ui.arrow.right} />
      </button>
    </box>
  )
}
