import type { Opt } from 'src/lib/options'
import type { AnchorLayout, RevealTransitionWithAuto } from 'src/lib/options/types'

export type CountdownStackTransition =
  "NONE" |
  "CROSSFADE" |
  "SLIDE_RIGHT" |
  "SLIDE_LEFT" |
  "SLIDE_UP" |
  "SLIDE_DOWN" |
  "SLIDE_LEFT_RIGHT" |
  "SLIDE_UP_DOWN" |
  "OVER_UP" |
  "OVER_DOWN" |
  "OVER_LEFT" |
  "OVER_RIGHT" |
  "UNDER_UP" |
  "UNDER_DOWN" |
  "UNDER_LEFT" |
  "UNDER_RIGHT" |
  "OVER_UP_DOWN" |
  "OVER_DOWN_UP" |
  "OVER_LEFT_RIGHT" |
  "OVER_RIGHT_LEFT" |
  "ROTATE_LEFT" |
  "ROTATE_RIGHT" |
  "ROTATE_LEFT_RIGHT"

export interface CountdownStyleOptions {
  bg: Opt<string>
  fg: Opt<string>
  radius: Opt<number>
  padding: Opt<number>
  gap: Opt<number>
  overlayBg: Opt<string>
  overlayFg: Opt<string>
  imageRadius: Opt<number>
  imageMinSize: Opt<number>
  titleSize: Opt<number>
  descriptionSize: Opt<number>
  timerSize: Opt<number>
  navSize: Opt<number>
}

export interface CountdownOptions {
  window: {
    layout: Opt<AnchorLayout>
    revealTransition: Opt<RevealTransitionWithAuto>
    transitionDuration: Opt<number>
    margin: Opt<number>
  }

  stack: {
    transition: Opt<CountdownStackTransition>
    duration: Opt<number>
  }

  refreshMs: Opt<number>
  pastLimit: Opt<number>

  style: CountdownStyleOptions
}
