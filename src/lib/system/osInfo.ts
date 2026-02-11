import GLib from "gi://GLib?version=2.0";

export const distro = {
    id: GLib.get_os_info('ID'),
    logo: GLib.get_os_info('LOGO'),
};
