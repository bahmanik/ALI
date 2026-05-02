import { opt } from ".."
import type { OptExports, Paths } from "../types"
import type { OptionsRoot } from "../root"
import type { VisualAsset } from "src/configuration/types"

export function overrideVisualAsset(params: {
  widgetId: string
  defaultUseLocal?: boolean
  defaultLocal: VisualAsset
  defaultRemote: VisualAsset | ((root: OptionsRoot) => VisualAsset)
  deps?: Paths<OptionsRoot>[]
  exports?: OptExports
}) {
  const {
    defaultUseLocal = false,
    defaultLocal,
    defaultRemote,
    deps = [],
    exports = {},
  } = params

  return opt<VisualAsset>(defaultLocal, {
    ...exports,
    deps,
    derive: ({ root }) => {
      if (defaultUseLocal) return defaultLocal

      return typeof defaultRemote === "function"
        ? defaultRemote(root)
        : defaultRemote
    },
  })
}
