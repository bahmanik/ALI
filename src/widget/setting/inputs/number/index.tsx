import { Gtk } from 'ags/gtk4';
import { Accessor, With } from 'gnim';
import icons from 'src/lib/icons/icons';
import { NumberInputterProps } from '../types';

function NumberInputter<T extends string | number | boolean | object>({
  opt,
  min,
  max,
  increment = 1,
  isUnsaved,
  setIsUnsaved,
}: NumberInputterProps<T>): JSX.Element {
  return (
    <box>
      <box class="unsaved-icon-container" halign={Gtk.Align.START}>
        <With value={isUnsaved}>
          {(on) => on && (
            <image
              class="unsaved-icon"
              iconName={icons.ui.warning}
              tooltipText="Press 'Enter' to apply your changes."
            />
          )}
        </With>
      </box>
      <Gtk.SpinButton
        onValueChanged={(self) => {
          const currentText = self.value;
          const optValue = opt.get();
          setIsUnsaved(currentText !== optValue);
        }}
        onActivate={(self) => {
          opt.set(self.value as T);
        }}
        $={(self) => {
          self.set_range(min, max);
          self.set_increments(1 * increment, 5 * increment);
          self.connect('activate', () => {
            setIsUnsaved(Number(self.get_text()) !== opt.get());
          });

          //WARNING: you should hook this
          self.set_value(opt.get() as number);
          setIsUnsaved(Number(self.get_text()) !== opt.get());

        }}
      />
    </box>
  );
};

export default NumberInputter
