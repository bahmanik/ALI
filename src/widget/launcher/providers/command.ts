import { createState } from "gnim"
import type { CommandOption } from "../types"

export interface CommandResult {
  command: CommandOption
}

const [commandHistory, setCommandHistory] = createState<string[]>([
  "ls -la", "htop", "nvim", "git status", "systemctl status",
])

export default function getCommandResults(
  query: string,
  isPrefixSearch = false,
): CommandResult[] {
  const q = query.trim()

  // Empty query with prefix → show history
  if (isPrefixSearch && q === "") {
    return commandHistory.peek().slice(0, 5).map((command) => ({
      command: { command, description: "Recently run", icon: "utilities-terminal-symbolic" },
    }))
  }

  if (!q) return []

  const inTerminal = q.startsWith("!")
  const cmd = inTerminal ? q.slice(1).trim() : q
  if (!cmd) return []

  return [{
    command: {
      command: cmd,
      description: inTerminal ? "Run in terminal" : "Run command",
      icon: inTerminal ? "utilities-terminal-symbolic" : "system-run-symbolic",
      terminal: inTerminal,
    },
  }]
}

export function addToCommandHistory(command: string) {
  const history = commandHistory.peek()
  setCommandHistory(
    [command, ...history.filter((c) => c !== command)].slice(0, 50),
  )
}
