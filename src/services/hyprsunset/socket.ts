import { subprocess } from "ags/process";
import GLib from "gi://GLib";

const socketPath = "/run/user/1000/hypr/0002f148c9a4fe421a9d33c0faa5528cdc411e62_1775031880_15748176/.hyprsunset.sock";
function connectsocket2() {
  const handleIPCMessage = (line: string) => { console.log("this is a ips message: ") }
  const ioChannel = GLib.IOChannel.unix_new(5);
  if (ioChannel) {
    GLib.io_add_watch(ioChannel, GLib.PRIORITY_DEFAULT, GLib.IOCondition.IN, (_, cond) => {
      if (cond & GLib.IOCondition.IN) {
        const msg = ioChannel.read_line();
        handleIPCMessage(msg[1]);
      }
      return true;
    });
  }
}

function connectsocket1() {
  const handleIPCMessage = (line: string) => { console.log("this is a ips message: ") }
  try {
    const ipcProcess = subprocess({
      cmd: ["socat", "-U", "-", `UNIX-CONNECT:${socketPath}`],
      out: (line) => handleIPCMessage(line),
      err: (error) => console.error("IPC error", { error }),
    });
    console.log("IPC listener started", { socketPath });
  } catch (error) {
    console.log("Failed to start IPC listener", { error });
  }
}

connectsocket2()
