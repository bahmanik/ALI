import { mkOptions, type OptionsRoot } from "src/lib/options";

import global from "./global";
import display from "./display";
import colors from "./colors";
import hyprland from "./hyprland";

import {
    osd,
    bar,
    launcher,
    calendar,
    countdown
} from "./widgets";

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
