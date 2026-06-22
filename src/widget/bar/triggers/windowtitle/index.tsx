import AstalHyprland from "gi://AstalHyprland?version=0.1"
import { options } from "./options"
import { getTitle, getWindowMatch, truncateTitle } from "./helpers/title"
import { Accessor, createBinding } from "gnim"
import type { BarTriggerProps } from "../types"

const hyprlandService = AstalHyprland.get_default()
const client = createBinding(hyprlandService, "focusedClient")

interface ClientIconProps {
  client: Accessor<AstalHyprland.Client>
}

interface ClientLabelProps {
  client: Accessor<AstalHyprland.Client>
  useCustomTitle: boolean
  useClassName: boolean
  showIcon: boolean
  truncate: boolean
  truncationSize: number
}

const ClientIcon = ({ client }: ClientIconProps): JSX.Element => (
  <label
    class={"bar-button-icon windowtitle txt-icon bar"}
    label={client.as(c => getWindowMatch(c).icon)}
  />
)

const ClientLabel = ({
  client,
  useCustomTitle,
  useClassName,
  showIcon,
  truncate,
  truncationSize,
}: ClientLabelProps): JSX.Element => (
  <label
    class={`bar-button-label windowtitle ${showIcon ? "" : "no-icon"}`}
    label={client(c =>
      truncateTitle(
        getTitle(c, useCustomTitle, useClassName),
        truncate ? truncationSize : -1,
      ),
    )}
  />
)

export default function WindowtitleTrigger(_props: BarTriggerProps) {
  const { custom_title, class_name, icon, truncation, truncation_size } = options

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
