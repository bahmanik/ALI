// this is legacy code it is here so i can have a example of how to connect to a socket
import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"

function getPath() {
  const runtime = GLib.getenv("XDG_RUNTIME_DIR")
  const signiture = GLib.getenv("HYPRLAND_INSTANCE_SIGNATURE")
  return `${runtime}/hypr/${signiture}/.hyprsunset.sock`
}

function listenSocket() {
  const client = new Gio.SocketClient()
  const address = new Gio.UnixSocketAddress({ path: getPath() })

  client.connect_async(address, null, (client, res) => {
    try {
      const connection = client?.connect_finish(res)
      const input = new Gio.DataInputStream({
        base_stream: connection?.get_input_stream()
      })

      function readSocket() {
        input.read_line_async(0, null, (stream, res) => {
          try {
            console.log("listening;")
            const [line] = stream?.read_line_finish(res)
            if (line) {
              print(line)
            }
            readSocket()
          } catch (err) {
            print("socket closed")
          }
        })
      }
      readSocket()
    } catch (err) {
      console.log("socket no found")
    }
  })
}

function setTemp(temperature: number) {
  const client = new Gio.SocketClient()
  const address = new Gio.UnixSocketAddress({ path: getPath() })

  client.connect_async(address, null, (client, res) => {
    try {
      const connection = client?.connect_finish(res)
      const output = connection?.get_output_stream()
      const command = `temperature ${temperature}\n`

      output?.write_all(
        new TextEncoder().encode(command),
        null
      )
      connection?.close(null)
    } catch (e) {
      console.error(e)
    }
  })
}
