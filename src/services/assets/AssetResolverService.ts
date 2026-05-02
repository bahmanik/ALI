import type { ResolvedAsset, VisualAsset } from './types'
import { TechniqueImageService } from '../image/TechniqueImageService'

export class AssetResolverService {
  static async resolve(asset: VisualAsset): Promise<ResolvedAsset> {
    switch (asset.kind) {
      case 'solid':
        return { asset }

      case 'pattern':
        return {
          asset,
          renderPath: asset.path,
        }

      case 'image': {
        const renderPath = await TechniqueImageService
          .getInstance()
          .resolveAsset(asset)

        return {
          asset,
          renderPath,
        }
      }
    }
  }
}
