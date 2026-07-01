import app from 'ags/gtk4/app';
import options from '../configuration';
import { initializeHotReload } from './utils/hotReload';
import { SystemUtilities } from '../lib/system/SystemUtilities';
import { readFile, writeFile } from 'ags/file';
import type { Opt } from '../lib/options';
import { startOnce } from 'src/services/startOnce';
import { SRC_DIR, TMP } from "src/lib/session/api";

/**
 * Central manager for theme styling throughout the application
 * Handles the transformation of theme options into compiled CSS
 */
class ThemeStyleManager {
  private readonly _style_scss_path = `${SRC_DIR}/style/main.scss`;
  private readonly _variables_path = `${TMP}/variables.scss`;
  private readonly _entry_scss_path = `${TMP}/entry.scss`;
  private readonly _compiled_css_path = `${TMP}/main.css`;

  public async applyCss(): Promise<void> {
    console.log("applyCss")
    if (!SystemUtilities.checkDependencies('sass')) return;

    try {
      const variables = await this._generateThemeVariables();

      await this._compileSass(variables);

      this._applyCss();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @returns An array of Options with True exports.scss
   */
  public getCssOptions(): Opt[] {
    const optArray = options.toArray();
    const scssOptArray = optArray.filter(e => e.exports.scss)
    return scssOptArray
  }

  /**
   * Recursively processes theme objects to generate SCSS variables
   * Handles nested properties by creating properly namespaced variable names
   *
   * @returns An array of SCSS variable declarations using standard theme values
   */
  private async _generateThemeVariables(): Promise<string[]> {
    const cssVariables: string[] = [];

    const optArray = this.getCssOptions();

    for (const opt of optArray) {
      const currentPath = opt.id;

      const variableName = this._buildCssVariableName(currentPath);
      const variable = this._buildCssVariable(variableName, opt);

      cssVariables.push(variable);
    }

    return cssVariables;
  }

  /**
   * Handles object properties that have values needing transformation
   * Creates properly formatted SCSS variable declarations
   *
   * NOTE:
   * - Strings MUST be serialized to valid Sass/CSS tokens.
   * - File paths must be quoted ("/home/..."), otherwise Sass will parse them as expressions.
   * - GTK symbolic colors like @theme_fg_color must be emitted via interpolation: #{"@theme_fg_color"}
   */
  private _buildCssVariable(variableName: string, property: Opt): string {
    const raw = property.get();
    const scssValue = this._toScssLiteral(raw);
    const line = `$${variableName}: ${scssValue};`;
    return line;
  }

  /**
   * Convert JS values into safe SCSS literals.
   * Keep this strict: exporting "raw CSS strings" is a footgun.
   */
  private _toScssLiteral(value: unknown): string {
    if (value === null || value === undefined) return 'null';

    switch (typeof value) {
      case 'number':
        return Number.isFinite(value) ? String(value) : 'null';

      case 'boolean':
        return value ? 'true' : 'false';

      case 'string':
        return this._toScssString(value);

      default:
        // Objects/arrays should generally NOT be exported directly.
        // If this happens, warn and fallback to a quoted JSON string (so Sass won’t break).
        try {
          const json = JSON.stringify(value);
          console.warn('[ThemeStyleManager] Non-primitive SCSS export; serializing as JSON string:', value);
          return JSON.stringify(json);
        } catch {
          console.warn('[ThemeStyleManager] Non-primitive SCSS export; could not serialize:', value);
          return 'null';
        }
    }
  }

  //TODO: write _toScssString a better function

  /**
   * Serialize strings so Sass parses them correctly.
   * We allow a small, safe set of "raw token" patterns (colors, keywords, numbers+units, etc.).
   * Everything else becomes a quoted string.
   */
  private _toScssString(str: string): string {
    // Empty string MUST become "", not nothing.
    if (str.length === 0) return '""';

    // GTK symbolic colors: @theme_fg_color, @theme_bg_color, etc.
    // In Sass, "@..." is not a valid value token, so we must interpolate.
    if (/^@[\w-]+$/.test(str)) return `#{"${str}"}`;

    // Common CSS keywords you may want unquoted
    if (/^(none|inherit|initial|unset|auto|transparent|currentColor)$/.test(str)) return str;

    // Hex colors (#rgb, #rgba, #rrggbb, #rrggbbaa)
    if (/^#[0-9a-fA-F]{3,4}$/.test(str) || /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(str)) return str;

    // Plain numbers (optionally with simple units) should stay raw
    if (/^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|pt)?$/.test(str)) return str;

    // Common CSS functions (rgb(), rgba(), hsl(), url(), linear-gradient(), etc.)
    // Allowing these as raw tokens keeps colors/gradients usable without forcing users into quotes.
    if (/^[a-zA-Z_-][\w-]*\([^;]*\)$/.test(str)) return str;

    // Everything else: quote + escape safely.
    // JSON.stringify gives you correct escaping for quotes, backslashes, newlines, etc.
    return JSON.stringify(str);
  }

  /**
   * Transforms dotted paths into hyphenated CSS variable names
   *
   * @param path - Dot-notation path of an option (e.g., "bar.background.primary")
   * @returns CSS-friendly variable name (e.g., "bar-background-primary")
   */
  private _buildCssVariableName(path: string): string {
    return path.split('.').join('-');
  }

  /**
   * Executes the SCSS compilation process with generated variables
   * Combines main SCSS with custom variables and module styles
   *
   * @param themeVariables - Array of SCSS variable declarations for user customization options
   *
   * File paths used in compilation:
   * - themeVariablesPath: Contains all user-configurable variables (theme colors, margins, borders, etc.)
   * - appScssPath: The application's main SCSS entry point file
   * - entryScssPath: A temporary file that combines all SCSS sources in the correct order
   * - compiledCssPath: The final compiled CSS that gets used by the application
   */
  private async _compileSass(themeVariables: string[]): Promise<void> {
    const themeVariablesPath = this._variables_path
    const appScssPath = this._style_scss_path
    const entryScssPath = this._entry_scss_path
    const compiledCssPath = this._compiled_css_path

    const scssImports = [`@import '${themeVariablesPath}';`];

    writeFile(themeVariablesPath, themeVariables.join('\n'));

    let combinedScss = readFile(appScssPath);
    combinedScss = `${scssImports.join('\n')}\n${combinedScss}`;

    writeFile(entryScssPath, combinedScss);

    await SystemUtilities.bash(
      `sass --load-path=${SRC_DIR}/style ${entryScssPath} ${compiledCssPath}`,
    );
  }

  /**
   * Loads the compiled CSS into the application
   *
   * @remarks
   * Uses the compiled CSS file generated in _compileSass to apply styles to the application
   */
  private _applyCss(): void {
    const compiledCssPath = `${TMP}/main.css`;

    app.apply_css(compiledCssPath, true);
  }
}

let _themeManager: ThemeStyleManager | null = null;

export function getThemeManager(): ThemeStyleManager {
  if (!_themeManager) _themeManager = new ThemeStyleManager();
  return _themeManager;
}

/**
 * Explicit style runtime boot.
 * This was previously executed at import-time (including top-level await).
 */
export const bootStyle = startOnce(async () => {
  const themeManager = getThemeManager();

  // Get ids of options that export SCSS.
  const optionsToWatch = themeManager.getCssOptions().map((e) => e.id);

  await initializeHotReload(themeManager.applyCss.bind(themeManager));
  options.handler(optionsToWatch, themeManager.applyCss.bind(themeManager));
  await themeManager.applyCss();
});
