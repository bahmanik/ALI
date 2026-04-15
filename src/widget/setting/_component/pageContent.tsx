import { Gtk } from 'ags/gtk4';
import { Accessor, createState, onCleanup } from 'gnim';
import { SettingPages } from '..';
import { Dashboard, Global } from '../pages';

function PageContent({ page }: { page: Accessor<SettingPages> }): JSX.Element {
  return (
    <stack
      class="themes-menu-stack"
      transitionType={Gtk.StackTransitionType.SLIDE_LEFT}
      transitionDuration={1.7}
      vexpand={false}
      hexpand
      $={(self) => {
        const unsub = page.subscribe(() => {
          console.log("sub is fired")
          self.set_visible_child_name(page.peek())
        });
        onCleanup(() => unsub());
      }}
    >
      <Dashboard
        $type={"named"}
        name="Global"
      />
      <Global
        $type={"named"}
        name="Global"
      />
    </stack>
  );
};

export default PageContent
