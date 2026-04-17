import { Gtk } from 'ags/gtk4';
import { Accessor, onCleanup } from 'gnim';
import { Dashboard, Global, SettingPage, Launcher } from '../pages';

function PageContent({ page }: { page: Accessor<SettingPage> }): JSX.Element {
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
      <Global
        $type={"named"}
        name="Global"
      />
      <Dashboard
        $type={"named"}
        name="Dashboard"
      />
      <Launcher
        $type={"named"}
        name="Launcher"
      />
    </stack>
  );
};

export default PageContent
