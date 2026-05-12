import type { Opt } from 'src/lib/options'
import type { AnchorLayoutType, HexColor, RevealTransitionWithAuto, RgbaColor, StackTransition } from 'src/configuration/types'

export interface CountdownStyleOptions {
  bg: Opt<HexColor>
  fg: Opt<HexColor>
  radius: Opt<number>
  padding: Opt<number>
  gap: Opt<number>
  overlayBg: Opt<RgbaColor>
  overlayFg: Opt<HexColor>
  imageRadius: Opt<number>
  imageMinSize: Opt<number>
  titleSize: Opt<number>
  descriptionSize: Opt<number>
  timerSize: Opt<number>
  navSize: Opt<number>
}

export interface CountdownOptions {
  window: {
    layout: Opt<AnchorLayoutType>
    revealTransition: Opt<RevealTransitionWithAuto>
    transitionDuration: Opt<number>
    margin: Opt<number>
  }

  stack: {
    transition: Opt<StackTransition>
    duration: Opt<number>
  }

  refreshMs: Opt<number>
  pastLimit: Opt<number>

  style: CountdownStyleOptions
}
