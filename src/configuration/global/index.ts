import { opt } from "src/lib/options";
import { Pattern } from "src/lib/options/types";

export default {
    scale: opt(32),
    pattern: opt<Pattern>({
        path: "/home/ali/.config/ALI/patter.jpg",
        size: 12,
    })
}
