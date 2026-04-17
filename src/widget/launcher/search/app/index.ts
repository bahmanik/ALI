import AstalApps from "gi://AstalApps?version=0.1";
import DesktopScanner from "./scanner"

export interface DesktopEntry {
  name: string;
  exec: string;
  icon: string;
  description?: string;
  categories?: string[];
  keywords?: string[];
  path: string;
  isAppImage?: boolean;
}

export interface AppButtonResult {
  app?: AstalApps.Application;
  customEntry?: DesktopEntry;
  index: number;
}

const apps = new AstalApps.Apps({})

// Helper to check if a desktop entry is already in AstalApps
function isInAstalApps(entry: DesktopEntry, astalApps: AstalApps.Application[]): boolean {
  const entryName = entry.name.toLowerCase();
  const entryExec = entry.exec.split("/").pop()?.toLowerCase() || "";

  return astalApps.some(app => {
    const appName = app.name?.toLowerCase() || "";
    const appExec = app.executable?.toLowerCase() || "";

    // Check if names match or executables match
    return appName === entryName ||
      (appExec && entryExec && appExec.includes(entryExec)) ||
      (appExec && entryExec && entryExec.includes(appExec));
  });
}

export default function getAppResults(searchText: string): AppButtonResult[] {
  // Get results from AstalApps
  const astalResults = apps.fuzzy_query(searchText);
  const astalAppResults: AppButtonResult[] = astalResults
    .slice(0, 5)
    .map((app, index) => ({ app, index }));

  // Get results from our custom scanner
  const customResults = DesktopScanner.fuzzySearch(searchText);

  // Filter out duplicates - only include custom entries not already in AstalApps
  const uniqueCustomResults = customResults.filter(entry =>
    !isInAstalApps(entry, astalResults)
  );

  const customAppResults: AppButtonResult[] = uniqueCustomResults
    .slice(0, 5)
    .map((entry, index) => ({
      customEntry: entry,
      index: astalAppResults.length + index
    }));

  // Combine results, prioritizing AstalApps results
  const combinedResults = [...astalAppResults, ...customAppResults];

  // Limit total results
  return combinedResults.slice(0, 10);
}
