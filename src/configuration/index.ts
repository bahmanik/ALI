import { mkOptions } from "src/lib/options";
import {
    bar,
    calendar,
    countdown,
    dashboard,
    launcher,
    osd,
} from "./widgets";
import global from "./global";
import display from "./display";
import colors from "./colors";
import hyprland from "./hyprland";

const options = mkOptions({
    global,
    countdown,
    display,
    colors,
    osd,
    bar,
    launcher,
    calendar,
    hyprland,
    dashboard,
});

export default options;
