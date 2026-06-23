import type { Opt } from 'src/lib/options'
import type { ColorWithAlpha, HexColor, StackTransition } from 'src/configuration/types'
import { ContainerStyleOptions } from 'src/lib/options/factories/overrideContainer';
import { PopupWindowOptions } from 'src/lib/options/factories/overridePopupWindow';

export interface CountdownStyleOptions extends ContainerStyleOptions {
  fg: ColorWithAlpha;
  overlayBg: ColorWithAlpha;   // was RgbaColor
  overlayFg: Opt<HexColor>;         // fully opaque accent
  gap: Opt<number>;
  imageRadius: Opt<number>;
  imageMinSize: Opt<number>;
  titleSize: Opt<number>;
  descriptionSize: Opt<number>;
  timerSize: Opt<number>;
  navSize: Opt<number>;
}

export interface CountdownOptions {
  window: PopupWindowOptions;  // replaces the inline window block; keep all fields

  stack: {
    transition: Opt<StackTransition>;
    duration: Opt<number>;
  };

  refreshMs: Opt<number>;
  pastLimit: Opt<number>;
  style: CountdownStyleOptions;
}
