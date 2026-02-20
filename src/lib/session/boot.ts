import app from "ags/gtk4/app";
import { startOnce } from "src/services/startOnce";
import {
  CACHE,
  CONFIG_DIR,
  CONFIG_FILE,
  ICON_DIR,
  TMP,
  ensureDirectory,
  ensureFile,
  ensureParentDir,
} from "./api";

// -----------------------------
// Session boot (start-y things)
// -----------------------------

/**
 * Ensure on-disk session folders exist and register icon search path.
 * Idempotent.
 */
export const bootSession = startOnce(async () => {
  ensureDirectory(CONFIG_DIR);
  ensureDirectory(CACHE);
  ensureDirectory(TMP);
  ensureParentDir(CONFIG_FILE);
  ensureFile(CONFIG_FILE);

  // Safe even if missing; GTK just won't find anything there.
  try {
    app.add_icons(ICON_DIR);
  } catch {
    // ignore
  }
});
