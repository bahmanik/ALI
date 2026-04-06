import HyprsunsetService from 'src/services/hyprsunset';
import { hyprsunsetOptions } from './options';
import { createState } from 'gnim';
import { Gtk } from 'ags/gtk4';

const {
  label,
  onIcon,
  offIcon,
  onLabel,
  offLabel,
  temperature,
} = hyprsunsetOptions

function Hyprsunset() {
  const sunset = new HyprsunsetService()
  const [enable, setEnable] = createState(false)
  const labelBinding = enable((c) => c ? "on" : "off")
  return (
    <menubutton>
      <label label={labelBinding} />
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL}>
          <button
            onClicked={() => {
              setEnable(c => !c)
              enable.peek() ? sunset.enable(temperature) : sunset.disable()
            }}
          >
            enable
          </button>
          <slider
            min={1000}
            max={12000}
            value={sunset.temperature}
            onChangeValue={({ value }) => {
              sunset.temperature = value;
            }}
            hexpand
          />
        </box>
      </popover>
    </menubutton>
  )
}

export default Hyprsunset
