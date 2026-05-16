import { opt } from "src/lib/options"
import { GlobalOptions } from "./type"
import { VisualAsset } from "../types"

const global: GlobalOptions = {
    scale: opt(32),
    background: opt<VisualAsset>({
        kind: "solid",
        color: "",
    }),
}

declare module "src/lib/options/root" {
    interface OptionsRoot {
        global: GlobalOptions
    }
}

export default global
