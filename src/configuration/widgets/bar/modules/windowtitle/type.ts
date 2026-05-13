import type { Opt } from "src/lib/options";

export interface windowtitleOptions {
  custom_title: Opt<boolean>,
  title_map: Opt<Array<string>>,
  class_name: Opt<boolean>,
  label: Opt<boolean>,
  icon: Opt<boolean>,
  truncation: Opt<boolean>,
  truncation_size: Opt<number>,
}
