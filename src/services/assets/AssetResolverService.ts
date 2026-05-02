import type { ResolvedAsset, VisualAsset } from './types'
import { AssetPipelineService } from './AssetPipelineService'

export class AssetResolverService {
  static async resolve(asset: VisualAsset): Promise<ResolvedAsset> {
    return AssetPipelineService.getInstance().resolve(asset)
  }
}
