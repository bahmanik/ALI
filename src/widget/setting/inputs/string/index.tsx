import { createState, onCleanup, With } from 'gnim';
import icons from 'src/lib/icons/icons';
import { StringInputterProps } from '../types';

function StringInputter({
  opt,
}: StringInputterProps): JSX.Element {
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
          const currentText = self.text;
          const optValue = opt.get();
          setIsUnsaved(currentText !== optValue);
        }}
        onActivate={(self) => {
          opt.set(self.text);
        }}
        $={(self) => {
          self.text = opt.get()
          setIsUnsaved(false);

          //WARNING: you should hook this
          const unsub = opt.subscribe(() => {
            self.text = opt.get()
            setIsUnsaved(false);
          })

          onCleanup(() => unsub())
        }}
      />
    </box>
  );
};

export default StringInputter
