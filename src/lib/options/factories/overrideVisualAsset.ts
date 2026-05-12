import { opt, type Opt } from "src/lib/options"
import type { VisualAsset } from "src/configuration/types"

interface OverrideVisualAssetParams {
  widgetId: string
  defaultUseLocal: boolean
  defaultLocal: VisualAsset
  defaultRemote: (context: any) => VisualAsset
  deps?: string[]
}

export function overrideVisualAsset(config: OverrideVisualAssetParams): Opt<VisualAsset> {
  // 1. Create hidden, persistent backing options to store custom user overrides safely
  const isOverriddenOpt = opt(false)
  const customAssetOpt = opt<VisualAsset>(config.defaultLocal)

  // 2. Create the primary derived option consumed by your UI components and views
  const mainOpt = opt<VisualAsset>(config.defaultLocal, {
    // Include backing stores in the dependency array so state changes trigger re-evaluations
    deps: [isOverriddenOpt.id, customAssetOpt.id, ...(config.deps || [])],
    derive: (context) => {
      // Priority A: If the user explicitly committed a custom asset, preserve and return it
      if (isOverriddenOpt.get()) {
        return customAssetOpt.get()
      }

      // Priority B: Evaluate standard local vs remote derivation logic
      if (config.defaultUseLocal) {
        return config.defaultLocal
      }
      return config.defaultRemote(context)
    }
  })

  // 3. Intercept direct .set() calls to persist the custom state backing stores
  const originalSet = mainOpt.set.bind(mainOpt)
  mainOpt.set = (newAsset: VisualAsset) => {
    // Persist the custom payload and flag the stream as manually overridden
    customAssetOpt.set(newAsset)
    isOverriddenOpt.set(true)

    // Broadcast the update to runtime listeners
    originalSet(newAsset)
  }

  // 4. Augment the option proxy with a clean reset routine to restore dynamic syncing
  mainOpt.reset = () => {
    isOverriddenOpt.set(false)
    customAssetOpt.set(config.defaultLocal)
    // Force a re-evaluation of the derived stream
    originalSet(config.defaultUseLocal ? config.defaultLocal : config.defaultRemote({}))
  }

  return mainOpt
}
