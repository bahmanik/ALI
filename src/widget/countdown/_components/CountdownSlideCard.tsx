import type { Accessor } from 'gnim'
import type { CountdownUiSlide } from 'src/services/countdown'

import { Gtk } from 'ags/gtk4'

import { fileUri, formatRemaining } from '../helpers'

export default function CountdownSlideCard(props: { slide: CountdownUiSlide; nowMs: Accessor<number> }): JSX.Element {
  const s = props.slide
  const cssBg = s.imagePath ? `background-image: url("${fileUri(s.imagePath)}");` : ''

  return (
    <box class="countdown-slide countdown-image" css={cssBg} hexpand vexpand>
      <box vexpand />

      <box class="countdown-overlay" orientation={Gtk.Orientation.VERTICAL} hexpand>
        <label class="countdown-title" label={s.title} xalign={0} wrap />
        <label
          class="countdown-description"
          label={s.description ?? ''}
          visible={Boolean(s.description)}
          xalign={0}
          wrap
        />
        <label class="countdown-timer" label={props.nowMs.as((n) => formatRemaining(s.whenMs - n))} xalign={0} wrap />
      </box>
    </box>
  )
}
