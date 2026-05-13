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
}

export default windowTitle 
