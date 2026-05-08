import { register } from "ags/gobject";
import { GServiceBase } from "../ServiceBase";
import { createState } from "ags";
import { monitorFile } from "ags/file";
import GLib from "gi://GLib?version=2.0";
import { execAsync, subprocess } from "ags/process";
import { options } from "./options";
import { SystemUtilities } from "src/lib/system/SystemUtilities";
import { CACHE, ensureDirectory } from "src/lib/session";

export interface ClipboardEntry {
  content: string;
  timestamp: number;
  type: "text" | "image" | "file";
  preview?: string;
  id?: string;
  imagePath?: string; // Path to saved image for image entries
  thumbnailPath?: string; // Path to cached square thumbnail
}

//WARNING: wire options later
@register({ GTypeName: "Cliphist" })
export default class CliphistService extends GServiceBase {
  private static _default: CliphistService | null = null;

  static get_default() {
    if (!this._default) this._default = new CliphistService();
    return this._default;
  }

  #list = createState<string[]>([]);

  constructor() {
    super();
  }

  protected async _boot() {
    if (!options.clipboard.enabled) return;
    if (!SystemUtilities.checkDependencies("wl-paste", "cliphist")) return;

    try {
      await this.stop();

      const maxItems = options.clipboard.max_items;
      SystemUtilities.bash(`wl-paste --watch cliphist -max-items ${maxItems} store`);
      monitorFile(`${GLib.get_user_cache_dir()}/cliphist/db`, () =>
        this.update(),
      );
    } catch (error) {
      console.error("Failed to start clipboard monitoring:", error);
    }
  }

  async stop() {
    subprocess(`pkill -f "wl-paste.*cliphist"`);
    SystemUtilities.bash(`rm -f ${CACHE}/cliphist/*.png`);
  }

  async update() {
    if (!SystemUtilities.checkDependencies("cliphist")) return;

    try {
      const list = await SystemUtilities.bash("cliphist list");
      this.#list[1](list.split("\n").filter((line) => line.trim()));
    } catch (error) {
      console.error("Failed to update clipboard history:", error);
    }
  }

  async load_image(id: string) {
    if (!SystemUtilities.checkDependencies("cliphist")) return;
    const imagePath = `${CACHE}/cliphist/${id}.png`;

    try {
      ensureDirectory(`${CACHE}/cliphist`);
      await SystemUtilities.bash(`cliphist decode ${id} > ${imagePath}`);
      return imagePath;
    } catch (error) {
      console.error("Failed to load image preview:", error);
    }
  }

  async copy(id: string) {
    if (!SystemUtilities.checkDependencies("cliphist")) return;
    try {
      return await SystemUtilities.bash(`cliphist decode ${id} | wl-copy`);
    } catch (error) {
      console.error("Failed to copy item:", error);
    }
  }

  async clear() {
    if (!SystemUtilities.checkDependencies("cliphist")) return;

    try {
      await SystemUtilities.bash("cliphist wipe");
      await this.update();
    } catch (error) {
      console.error("Failed to clear clipboard history:", error);
    }
  }

  get list() {
    return this.#list[0];
  }

  private async saveImageFromClipboard(
    cliphistId: string,
  ): Promise<string | undefined> {
    try {
      const imagePath = GLib.build_filenamev([
        this.imageCacheDir,
        `${cliphistId.replace(/[^a-zA-Z0-9]/g, "_")}.png`,
      ]);

      // Check if we already have this image cached
      if (GLib.file_test(imagePath, GLib.FileTest.EXISTS)) {
        // log.debug("Image already cached", { imagePath });
        return imagePath;
      }

      // Use cliphist decode to get the actual image data
      // The ID might need to be escaped for shell command
      const escapedId = cliphistId.replace(/'/g, "'\\''");

      // First try direct decode
      const command = `cliphist decode '${escapedId}' > "${imagePath}"`;

      console.debug("Saving image from clipboard", {
        cliphistId,
        escapedId,
        imagePath,
        command,
      });

      try {
        await execAsync(["sh", "-c", command]);
      } catch (e) {
        console.error("Failed to decode image with cliphist", {
          error: e,
          cliphistId,
        });
        // Try alternative: use the ID directly without quotes if it's numeric
        if (/^\d+$/.test(cliphistId)) {
          const altCommand = `cliphist decode ${cliphistId} > "${imagePath}"`;
          console.debug("Trying alternative decode command", { altCommand });
          await execAsync(["sh", "-c", altCommand]);
        } else {
          throw e;
        }
      }

      // Verify the file was created and has content
      if (GLib.file_test(imagePath, GLib.FileTest.EXISTS)) {
        try {
          // Try to verify it's a valid image by getting file info
          const fileInfo = GLib.file_test(imagePath, GLib.FileTest.IS_REGULAR);
          if (fileInfo) {
            console.debug("Image saved successfully", { imagePath });
            return imagePath;
          }
        } catch (e) {
          console.debug("File exists but might not be valid image", { imagePath });
          return imagePath; // Return anyway, let the image widget handle invalid images
        }
      } else {
        console.error("Image file was not created", { imagePath });
        // Try alternative method - direct wl-paste
        try {
          const altCommand = `wl-paste -t image/png > "${imagePath}" 2>/dev/null`;
          await execAsync(["sh", "-c", altCommand]);
          if (GLib.file_test(imagePath, GLib.FileTest.EXISTS)) {
            console.debug("Image saved using wl-paste", { imagePath });
            return imagePath;
          }
        } catch (altError) {
          console.error("Alternative image save also failed", altError);
        }
      }

      return undefined;
    } catch (error) {
      console.error("Failed to save image from clipboard", error);
      return undefined;
    }
  }

  async getHistory() {
    const lines = this.list.peek().filter((line) => line.trim())
    const entries = [];

    for (const line of lines.slice(0, 100)) {
      const tabIndex = line.indexOf("\t");
      if (tabIndex === -1) continue;

      const id = line.substring(0, tabIndex);
      const content = line.substring(tabIndex + 1);

      if (!content) continue;

      // Filter out single-letter entries (vim pollution)
      if (content.trim().length === 1) continue;

      // Check if this is image data (PNG/JPEG magic bytes or base64 image)
      // WARNING: is image data should be wired
      const isImageData = false
      let type: "text" | "image" | "file" = "text";
      let imagePath: string | undefined;
      let preview: string;

      if (isImageData) {
        type = "image";
        // Save image to cache and get path
        imagePath = await this.saveImageFromClipboard(id);

        // Extract image info from cliphist format if available
        // Format: [[ binary data 2 MiB png 1278x958 ]]
        const match = content.match(
          /\[\[\s*binary data\s+([^\s]+)\s+([^\s]+)\s+(\d+x\d+)?\s*\]\]/,
        );
        if (match) {
          const [, size, format, dimensions] = match;
          preview = `Image (${format.toUpperCase()}) ${size}${dimensions ? ` • ${dimensions}` : ""}`;
        } else {
          preview = "Image";
        }

        // log.debug("Detected image clipboard entry", {
        //   id,
        //   hasImagePath: !!imagePath,
        //   contentLength: content.length,
        //   preview,
        //   imagePath
        // });

        // Skip this entry if we couldn't save the image
        if (!imagePath) {
          console.warn("Skipping image entry without valid image path", { id });
          continue;
        }
      } else if (content.startsWith("file://")) {
        type = "file";
        const fileName =
          content.replace("file://", "").split("/").pop() || content;
        preview =
          fileName.length > 100
            ? fileName.substring(0, 100) + "..."
            : fileName;
      } else if (content.match(/\.(png|jpg|jpeg|gif|bmp|svg)$/i)) {
        type = "image";
        preview = content.split("/").pop() || "Image file";
      } else {
        // Text content
        const firstLine = content.split("\n")[0];
        const maxLength = 80; // Increased from 100 to show more content
        preview =
          firstLine.length > maxLength
            ? firstLine.substring(0, maxLength) + "..."
            : firstLine + (content.includes("\n") ? "..." : "");
      }

      entries.push({
        content,
        timestamp: Date.now() - entries.length * 60000, // Approximate timestamps
        type,
        preview,
        id,
        imagePath,
      });
    }
    console.debug("Updated clipboard history", { count: entries.length });
    return entries
  }
}
