import { TechniqueImageService } from "src/services/image/TechniqueImageService"
import type { VisualAsset } from "src/configuration/types"

type Subscriber = (outPath: string) => void

export class VisualAssetImageService {
  private static _instance: VisualAssetImageService | undefined

  public static getInstance(): VisualAssetImageService {
    if (!this._instance) this._instance = new VisualAssetImageService()
    return this._instance
  }

  private constructor() {}

  private readonly _imageSvc = TechniqueImageService.getInstance()

  public async getResolvedPath(asset: VisualAsset, group = "visual-asset"): Promise<string | null> {
    if (asset.kind === "solid") return null

    if (asset.kind === "pattern") {
      return this._imageSvc.getPng(asset.path, false, "none", group)
    }

    const technique = asset.technique ?? "none"
    return this._imageSvc.getPng(asset.path, technique !== "none", technique, group)
  }

  public watch(asset: VisualAsset, group: string, cb: Subscriber): () => void {
    if (asset.kind === "solid") {
      cb("")
      return () => {}
    }

    if (asset.kind === "pattern") {
      return this._imageSvc.watch(asset.path, false, "none", group, cb)
    }

    const technique = asset.technique ?? "none"
    return this._imageSvc.watch(asset.path, technique !== "none", technique, group, cb)
  }
}
