import { stem } from "src/configuration/helper"

import './type'
import type { CountdownOptions } from './type'

const countdown = stem((opt): CountdownOptions => ({
  window: {
    layout: opt('top-right'),
    revealTransition: opt('CROSSFADE'),
    transitionDuration: opt(1.6),
    margin: opt(12),
  },

  stack: {
    transition: opt('SLIDE_RIGHT'),
    duration: opt(220),
  },

  refreshMs: opt(1000),
  pastLimit: opt(12),

  style: {
    bg: opt('#0f1115', { scss: true }),
    fg: opt('#e7e7e7', { scss: true }),
    radius: opt(16, { scss: true }),
    padding: opt(14, { scss: true }),
    gap: opt(10, { scss: true }),
    overlayBg: opt('rgba(0,0,0,0.45)', { scss: true }),
    overlayFg: opt('#ffffff', { scss: true }),
    imageRadius: opt(14, { scss: true }),
    imageMinSize: opt(260, { scss: true }),
    titleSize: opt(20, { scss: true }),
    descriptionSize: opt(13, { scss: true }),
    timerSize: opt(14, { scss: true }),
    navSize: opt(18, { scss: true }),
  },
}))

export default countdown
