import { checkSunsetStatus, isActive, toggleSunset } from './helpers';
import { hyprsunsetOptions } from './options';

const {
  label,
  onIcon,
  offIcon,
  onLabel,
  offLabel,
  temperature,
} = hyprsunsetOptions

checkSunsetStatus();
toggleSunset(true)

const Hyprsunset = () => {
  return <box></box>
}

export default Hyprsunset
