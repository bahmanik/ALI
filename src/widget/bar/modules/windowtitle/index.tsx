import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { options } from "./options";
import { getTitle, getWindowMatch, truncateTitle } from "./helpers/title";
import { Accessor, createBinding } from "gnim";

const hyprlandService = AstalHyprland.get_default()
const client = createBinding(hyprlandService, 'focusedClient')

const Windowtitle = () => {
  const { custom_title, class_name, icon, truncation, truncation_size } = options

  const ClientIcon = ({ client }: ClientIconProps): JSX.Element => {
    return (
      <label
        class={'bar-button-icon windowtitle txt-icon bar'}
        label={client.as(c => getWindowMatch(c).icon)}
      />
    );
  };

  const ClientLabel = ({
    client,
    useCustomTitle,
    useClassName,
    showIcon,
    truncate,
    truncationSize,
  }: ClientLabelProps): JSX.Element => {
    return (
      <label
        class={`bar-button-label windowtitle ${showIcon ? '' : 'no-icon'}`}
        label={client(c => truncateTitle(
          getTitle(c, useCustomTitle, useClassName),
          truncate ? truncationSize : -1,
        ))}
      />
    );
  };

  return (
    <box class="">
      <ClientIcon client={client} />
      <ClientLabel
        client={client}
        useCustomTitle={custom_title}
        useClassName={class_name}
        truncate={truncation}
        truncationSize={truncation_size}
        showIcon={icon}
      />
    </box>
  )
}


interface ClientIconProps {
  client: Accessor<AstalHyprland.Client>;
}

interface ClientLabelProps {
  client: Accessor<AstalHyprland.Client>;
  useCustomTitle: boolean;
  useClassName: boolean;
  showIcon: boolean;
  truncate: boolean;
  truncationSize: number;
}

export default Windowtitle
