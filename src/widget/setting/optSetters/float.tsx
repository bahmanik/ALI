import { createState, With } from 'gnim';
import icons from 'src/lib/icons/icons';
import { Opt } from 'src/lib/options';

export const FloatInputter = <T extends string | number | boolean | object>({
  opt,
}: ObjectInputterProps<T>): JSX.Element => {
  const [isUnsaved, setIsUnsaved] = createState(false)
  return (
    <box>
      <box class="unsaved-icon-container">
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

      <entry
        class={isUnsaved.as((unsaved) => (unsaved ? 'unsaved' : ''))}
        onNotifyText={(self) => {
          const currentText = parseFloat(self.text);
          const serializedOpt = parseFloat(opt.get().toString());
          setIsUnsaved(currentText !== serializedOpt);
        }}
        onActivate={(self) => {
          try {
            const parsedValue = parseFloat(self.text);
            if (!isNaN(parsedValue)) {
              opt.set(parsedValue as unknown as T);
              setIsUnsaved(false);
            }
          } catch (error) {
            console.error('Invalid JSON input:', error);
          }
        }}
        $={(self) => {
          self.text = opt.get().toString();
          setIsUnsaved(self.text !== opt.get().toString());

          //WARNING: you should hook this
          self.text = opt.get().toString();
          setIsUnsaved(self.text !== opt.get().toString());

        }}
      />
    </box>
  );
};

interface ObjectInputterProps<T> {
  opt: Opt<T>;
}
