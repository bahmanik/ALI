import { Gtk } from 'ags/gtk4';
import { Accessor, onCleanup } from 'gnim';
import { SettingPage, settingPages } from '../pages';

function PageContent({ page }: { page: Accessor<SettingPage> }): JSX.Element {
  return (
    <stack
      class="themes-menu-stack"
      transitionType={Gtk.StackTransitionType.SLIDE_LEFT}
      transitionDuration={1.7}
      vexpand={false}
      hexpand
      $={(self) => {
        // Set the initial page immediately
        self.set_visible_child_name(page.peek());

        const unsub = page.subscribe(() => {
          console.log(`Switching stack to: ${page.peek()}`);
          self.set_visible_child_name(page.peek());
        });

        onCleanup(() => unsub());
      }}
    >
      {/* Dynamically iterate over the settingPages object */}
      {Object.entries(settingPages).map(([name, PageComponent]) => (
        <PageComponent
          $type="named"
          name={name}
        />
      ))}
    </stack>
  );
};

export default PageContent;
