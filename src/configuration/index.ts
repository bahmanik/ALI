import bar from './modules/bar';
import launcher from './modules/launcher';
import { mkOptions } from '../lib/options';
import hyprland from './hyprland';
import display from './display';
import osd from './modules/osd';
import colors from './colors';
import global from './global';

const options = mkOptions({
    global,
    display,
    colors,
    osd,
    bar,
    launcher,
    hyprland,
});

export default options;
