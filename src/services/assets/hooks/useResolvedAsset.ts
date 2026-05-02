import { createState, onMount } from 'gnim'
import { AssetResolverService } from '../AssetResolverService'
import type { ResolvedAsset, VisualAsset } from '../types'

export function useResolvedAsset(asset: VisualAsset) {
  const resolved = createState<ResolvedAsset | null>(null)

  onMount(async () => {
    resolved.set(await AssetResolverService.resolve(asset))
  })

  return resolved
}
