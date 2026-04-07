import { mkOptions } from "src/lib/options";
import {
    bar,
    calendar,
    countdown,
    launcher,
    osd,
} from "./widgets";
import global from "./global";
import display from "./display";
import colors from "./colors";

const options = mkOptions({
    global,
    countdown,
    display,
    colors,
    osd,
    bar,
    launcher,
    calendar,
    //hyprland,
});

export default options;
