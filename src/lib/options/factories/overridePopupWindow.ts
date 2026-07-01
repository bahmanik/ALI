import { opt } from "src/lib/options"
import type { OptExports } from "src/lib/options/types"
import type { AnchorLayoutType } from "src/configuration/types"
import type { RevealTransitionWithAuto } from "src/configuration/enums";

export function overridePopupWindow(params: {
  defaultLayout?: AnchorLayoutType;
  defaultRevealTransition?: RevealTransitionWithAuto;
  defaultTransitionDuration?: number;
  defaultMargin?: number[];
  defaultWidth?: number;
  defaultHeight?: number;
  exports?: OptExports;
} = {}) {
  const {
    defaultLayout = "center",
    defaultRevealTransition = "CROSSFADE",
    defaultTransitionDuration = 0.18,
    defaultMargin = [12, 12, 12, 12],
    defaultWidth = 0,
    defaultHeight = 0,
    exports: e = { scss: true },
  } = params

  return {
    layout: opt<AnchorLayoutType>(defaultLayout, e),
    revealTransition: opt<RevealTransitionWithAuto>(defaultRevealTransition, e),
    transitionDuration: opt<number>(defaultTransitionDuration, e),
    margin: opt<number[]>(defaultMargin),
    width: opt<number>(defaultWidth, e),
    height: opt<number>(defaultHeight, e),
  }
}

export type PopupWindowOptions = ReturnType<typeof overridePopupWindow>
