import HyprsunsetService from 'src/services/hyprsunset';
import { hyprsunsetOptions } from './options';
import { createState } from 'gnim';

const {
  label,
  onIcon,
  offIcon,
  onLabel,
  offLabel,
  temperature,
} = hyprsunsetOptions

const Hyprsunset = () => {
  const sunset = new HyprsunsetService()
  const [enable, setEnable] = createState(false)
  const labelBinding = enable((c) => c ? "on" : "off")
  return <button
    onClicked={() => {
      setEnable(c => !c)
      enable.peek() ? sunset.enable(temperature) : sunset.disable()
    }}
  ><label label={labelBinding} /></button>
}

export default Hyprsunset
