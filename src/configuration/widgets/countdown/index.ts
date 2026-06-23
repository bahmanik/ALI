import { opt } from 'src/lib/options'
import type { CountdownOptions } from './type'
import type {
  HexColor,
  StackTransition,
} from 'src/configuration/types'
import { colorWithAlpha } from 'src/lib/options/factories/colorWithAlpha'
import { overrideContainer } from 'src/lib/options/factories/overrideContainer'
import { overridePopupWindow } from 'src/lib/options/factories/overridePopupWindow'

const countdown: CountdownOptions = {
  window: overridePopupWindow({}),

  stack: {
    transition: opt<StackTransition>('SLIDE_RIGHT'),
    duration: opt(220),
  },

  refreshMs: opt(1000),
  pastLimit: opt(12),

  style: {
    fg: colorWithAlpha({ color: '#e7e7e7', alpha: 1 }),
    gap: opt(10, { scss: true }),
    overlayBg: colorWithAlpha({ color: '#000000', alpha: 0.45 }),
    overlayFg: opt<HexColor>('#ffffff', { scss: true }),
    imageRadius: opt(14, { scss: true }),
    imageMinSize: opt(260, { scss: true }),
    titleSize: opt(20, { scss: true }),
    descriptionSize: opt(13, { scss: true }),
    timerSize: opt(14, { scss: true }),
    navSize: opt(18, { scss: true }),
    ...overrideContainer({})
  },
}

declare module 'src/lib/options/root' {
  interface OptionsRoot {
    countdown: CountdownOptions
  }
}

export default countdown
