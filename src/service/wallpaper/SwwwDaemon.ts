import { execAsync } from "ags/process"
import { SystemUtilities } from "../../lib/system/SystemUtilities"

export type SwwwDaemonStartOptions = {
  namespace?: string
  layer?: "background" | "bottom"
  quiet?: boolean
}

/**
 * Manages the lifecycle of the swww daemon.
 *
 * Notes:
 * - We use `swww query` to detect readiness.
 * - We prefer argv arrays (no shell parsing) so paths/spaces are safe.
 */
export class SwwwDaemon {
  private _isRunning = false
  private _starting?: Promise<boolean>

  public get isRunning(): boolean {
    return this._isRunning
  }

  public isInstalled(): boolean {
    // swww package typically provides both swww and swww-daemon
    return SystemUtilities.checkDependencies("swww", "swww-daemon")
  }

  public async start(opts: SwwwDaemonStartOptions = {}): Promise<boolean> {
    if (!this.isInstalled()) {
      console.warn("[SwwwDaemon] swww is not installed")
      this._isRunning = false
      return false
    }

    // already running? done.
    if (await this._checkIfRunning(opts.namespace)) {
      this._isRunning = true
      return true
    }

    // prevent concurrent double-start (AGS reload / multiple subscribers)
    if (this._starting) return await this._starting

    this._starting = (async () => {
      const ok = await this._startNewDaemon(opts)

      // If start failed but daemon exists (race), accept it as success.
      if (!ok && (await this._checkIfRunning(opts.namespace))) {
        this._isRunning = true
        return true
      }

      return ok
    })().finally(() => {
      this._starting = undefined
    })

    return await this._starting
  }

  public async stop(namespace?: string): Promise<void> {
    try {
      await execAsync(this._killCmd(namespace))
    } catch (err) {
      const wasRunning = await this._checkIfRunning(namespace)
      if (wasRunning) console.error("[SwwwDaemon] Failed to stop swww:", err)
    } finally {
      this._isRunning = false
    }
  }

  private async _checkIfRunning(namespace?: string): Promise<boolean> {
    try {
      await execAsync(this._queryCmd(namespace))
      return true
    } catch {
      return false
    }
  }

  private async _startNewDaemon(opts: SwwwDaemonStartOptions): Promise<boolean> {
    const argv: string[] = ["swww-daemon"]

    if (opts.layer) argv.push("--layer", opts.layer)
    if (opts.quiet) argv.push("--quiet")
    if (opts.namespace) argv.push("--namespace", opts.namespace)

    try {
      await execAsync(argv)

      const ready = await this._waitForReady(opts.namespace)
      this._isRunning = ready

      if (!ready) {
        await this.stop(opts.namespace)
        console.error("[SwwwDaemon] swww-daemon did not become ready")
      }

      return ready
    } catch (err) {
      console.error("[SwwwDaemon] Failed to start swww-daemon:", err)
      this._isRunning = false
      return false
    }
  }

  private async _waitForReady(namespace?: string): Promise<boolean> {
    const maxAttempts = 10
    let delayMs = 50

    for (let i = 0; i < maxAttempts; i++) {
      try {
        await execAsync(this._queryCmd(namespace))
        return true
      } catch {
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          delayMs = Math.min(delayMs * 2, 1000)
        }
      }
    }

    return false
  }

  private _queryCmd(namespace?: string): string[] {
    const argv = ["swww", "query"]
    if (namespace) argv.push("--namespace", namespace)
    return argv
  }

  private _killCmd(namespace?: string): string[] {
    const argv = ["swww", "kill"]
    if (namespace) argv.push("--namespace", namespace)
    return argv
  }
}
