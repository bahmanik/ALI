import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { AnchorLayoutType, RevealTransitionWithAuto } from "src/configuration/types"

export function overridePopupWindow(params: {
  defaultLayout?: AnchorLayoutType;
  defaultRevealTransition?: RevealTransitionWithAuto;
  defaultTransitionDuration?: number;
  defaultMargin?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  exports?: OptExports;
} = {}) {
  const {
    defaultLayout = "center",
    defaultRevealTransition = "CROSSFADE",
    defaultTransitionDuration = 0.18,
    defaultMargin = 12,
    defaultWidth = 0,
    defaultHeight = 0,
    exports: e = { scss: true },
  } = params

  return {
    layout: opt<AnchorLayoutType>(defaultLayout, e),
    revealTransition: opt<RevealTransitionWithAuto>(defaultRevealTransition, e),
    transitionDuration: opt<number>(defaultTransitionDuration, e),
    margin: opt<number>(defaultMargin, e),
    width: opt<number>(defaultWidth, e),
    height: opt<number>(defaultHeight, e),
  }
}

export type PopupWindowOptions = ReturnType<typeof overridePopupWindow>
