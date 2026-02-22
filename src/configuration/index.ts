import { mkOptions, type OptionsRoot } from "src/lib/options";

import global from "./global";
import display from "./display";
import colors from "./colors";
import osd from "./modules/osd";
import bar from "./modules/bar";
import launcher from "./modules/launcher";
import hyprland from "./hyprland";
import calendar from "./modules/calendar";
import countdown from "./modules/countdown";

const options = mkOptions<OptionsRoot>({
    global,
    countdown,
    display,
    colors,
    osd,
    bar,
    launcher,
    calendar,
    hyprland,
});

export default options;
