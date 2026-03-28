import type { Opt } from "src/lib/options";

export interface windowtitleOptions {
  custom_title: Opt<true>,
  title_map: Opt<Array<string>>,
  class_name: Opt<boolean>,
  label: Opt<boolean>,
  icon: Opt<boolean>,
  truncation: Opt<boolean>,
  truncation_size: Opt<number>,
  leftClick: Opt<string>,
  rightClick: Opt<string>,
  middleClick: Opt<string>,
  scrollUp: Opt<string>,
  scrollDown: Opt<string>,
}
