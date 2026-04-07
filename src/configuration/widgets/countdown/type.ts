import type { Opt } from 'src/lib/options'
import type { AnchorLayout, RevealTransitionWithAuto, StackTransition } from 'src/configuration/types'

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
    transition: Opt<StackTransition>
    duration: Opt<number>
  }

  refreshMs: Opt<number>
  pastLimit: Opt<number>

  style: CountdownStyleOptions
}
