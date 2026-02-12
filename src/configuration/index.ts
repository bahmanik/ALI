import { mkOptions, type OptionsRoot } from "src/lib/options";

import global from "./global";
import display from "./display";
import colors from "./colors";
import osd from "./modules/osd";
import bar from "./modules/bar";
import launcher from "./modules/launcher";
import hyprland from "./hyprland";

const options = mkOptions<OptionsRoot>({
    global,
    display,
    colors,
    osd,
    bar,
    launcher,
    hyprland,
});

export default options;
