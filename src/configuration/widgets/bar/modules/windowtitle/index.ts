import { opt } from "src/lib/options"
import { windowtitleOptions } from "./type"

const windowTitle: windowtitleOptions = {
  custom_title: opt<boolean>(true),
  title_map: opt<Array<string>>([""]),
  class_name: opt<boolean>(false),
  label: opt<boolean>(true),
  icon: opt<boolean>(true),
  truncation: opt<boolean>(false),
  truncation_size: opt<number>(10),
  enable: opt(true, { scss: true }),
  gap: opt(0, { scss: true }),
  edge: opt(0, { scss: true }),
  radius: opt(12, { scss: true }),
}

export default windowTitle
