import type { Accessor } from "gnim"
import { timeout } from "ags/time"
import { createState, onCleanup } from "gnim"
import options from "src/configuration"
import { toRevealerTransition } from "src/widget/shared/helpers"
import { AppButton } from "./AppButton"
import { GenericResultRow } from "./GenericResultRow"
import type { SearchResult } from "../providers"
import { addToCommandHistory } from "../providers/command"

export function ResultRow({
  result,
  query,
  hideWindow,
}: {
  result: SearchResult
  query: Accessor<string>
  hideWindow: () => void
}) {
  const iconPx = options.launcher.icons.app.get()
  const itemGap = options.launcher.list.itemGap.get()
  const showDesc = Boolean(options.launcher.list.showDescription.get())

  // Wrap in an animated revealer for enter animation
  const animEnabled = options.launcher.animateResults.get() !== "NONE"
  const animDelay = Math.max(0, Number(options.launcher.animInDelayMs.get() ?? 0))
  const transitionType = toRevealerTransition(options.launcher.revealTransition.get())
  const transitionDuration = options.launcher.transitionDuration.get()

  const [revealed, setRevealed] = createState(!animEnabled)
  let tmr: ReturnType<typeof timeout>
  if (animEnabled) tmr = timeout(animDelay, () => setRevealed(true))
  onCleanup(() => tmr?.cancel?.())

  return (
    <revealer
      revealChild={revealed}
      transitionDuration={transitionDuration}
      transitionType={transitionType}
    >
      {renderResult(result, query, hideWindow, iconPx, itemGap, showDesc)}
    </revealer>
  )
}

// ─── Per-kind renderers ───────────────────────────────────────────────────────

function renderResult(
  result: SearchResult,
  query: Accessor<string>,
  hideWindow: () => void,
  iconPx: number,
  itemGap: number,
  showDesc: boolean,
): JSX.Element {
  switch (result.kind) {
    case "app": {
      const { app, customEntry } = result.data
      if (app) {
        return (
          <AppButton app={app} query={query} iconPx={iconPx} itemGap={itemGap} showDescription={showDesc} />
        )
      }
      if (customEntry) {
        return (
          <GenericResultRow
            icon={customEntry.icon || "application-x-executable-symbolic"}
            title={customEntry.name}
            subtitle={customEntry.description}
            onActivate={() => {
              import("ags/process").then(({ exec }) => exec(customEntry.exec))
              hideWindow()
            }}
          />
        )
      }
      return <box />
    }

    // case "clipboard": {
    //   const { entry } = result.data
    //   const icon =
    //     entry.type === "image" ? "image-x-generic-symbolic"
    //     : entry.type === "file" ? "document-symbolic"
    //     : "edit-paste-symbolic"
    //   return (
    //     <GenericResultRow
    //       icon={icon}
    //       title={entry.preview ?? entry.content.slice(0, 80)}
    //       subtitle={entry.type}
    //       onActivate={() => {
    //         import("src/services/cliphist").then(({ default: Cliphist }) => {
    //           Cliphist.get_default().select(entry)
    //         }).catch(() => {})
    //         hideWindow()
    //       }}
    //     />
    //   )
    // }

    case "command": {
      const { command } = result.data
      return (
        <GenericResultRow
          icon={command.icon ?? "utilities-terminal-symbolic"}
          title={command.command}
          subtitle={command.description}
          onActivate={() => {
            import("ags/process").then(({ exec, execAsync }) => {
              if (command.terminal) {
                execAsync(["bash", "-c", command.command]).catch(() => { })
              } else {
                exec(command.command)
              }
            })
            addToCommandHistory(command.command)
            hideWindow()
          }}
        />
      )
    }

    case "directory": {
      const dir = result.data
      return (
        <GenericResultRow
          icon={dir.isDirectory ? "folder-symbolic" : "document-symbolic"}
          title={dir.name}
          subtitle={dir.path}
          onActivate={() => {
            import("ags/process").then(({ execAsync }) => {
              execAsync(["xdg-open", dir.path]).catch(() => { })
            })
            hideWindow()
          }}
        />
      )
    }

    case "emoji": {
      const { entry } = result.data
      return (
        <GenericResultRow
          icon="face-smile-symbolic"
          title={`${entry.emoji}  ${entry.name}`}
          subtitle={entry.keywords.slice(0, 4).join(", ")}
          onActivate={() => {
            import("ags/process").then(({ exec }) => {
              exec(`bash -c "wl-copy '${entry.emoji}'"`)
            }).catch(() => { })
            hideWindow()
          }}
        />
      )
    }

    case "hyprland": {
      const { client } = result.data
      return (
        <GenericResultRow
          icon={client.class || "window-symbolic"}
          title={client.title || client.class || "Unknown window"}
          subtitle={`${client.class}  ·  workspace ${client.workspace.id}`}
          onActivate={() => {
            import("ags/process").then(({ execAsync }) => {
              execAsync(["hyprctl", "dispatch", "focuswindow", `address:${client.address}`]).catch(() => { })
            })
            hideWindow()
          }}
        />
      )
    }

    case "kill": {
      const { action } = result.data
      return (
        <GenericResultRow
          icon={action.icon}
          title={action.name}
          subtitle={action.description}
          onActivate={() => {
            import("ags/process").then(({ execAsync }) => {
              if (action.type === "port" && action.port != null) {
                execAsync(["bash", "-c",
                  `fuser -k ${action.port}/tcp 2>/dev/null || lsof -ti:${action.port} | xargs kill -9 2>/dev/null`,
                ]).catch(() => { })
              } else if (action.type === "process" && action.pid != null) {
                execAsync(["kill", "-9", String(action.pid)]).catch(() => { })
              } else if (action.type === "window-click") {
                execAsync(["hyprctl", "dispatch", "killactive"]).catch(() => { })
              }
            })
            hideWindow()
          }}
        />
      )
    }

    case "system": {
      const { action } = result.data
      return (
        <GenericResultRow
          icon={action.icon}
          title={action.name}
          subtitle={action.description}
          onActivate={() => {
            import("ags/process").then(({ exec }) => exec(action.command))
            hideWindow()
          }}
        />
      )
    }

    case "tmux": {
      const { target } = result.data
      const title =
        target.type === "session"
          ? target.sessionName
          : `${target.sessionName}:${target.windowIndex} — ${target.windowName ?? ""}`
      return (
        <GenericResultRow
          icon={target.icon}
          title={title}
          subtitle={target.description}
          onActivate={() => {
            import("ags/process").then(({ execAsync }) => {
              execAsync(["bash", "-c",
                `$TERMINAL -e tmux attach-session -t ${target.sessionId} 2>/dev/null` +
                ` || xterm -e tmux attach-session -t ${target.sessionId}`,
              ]).catch(() => { })
            })
            hideWindow()
          }}
        />
      )
    }

    default:
      return <box />
  }
}
