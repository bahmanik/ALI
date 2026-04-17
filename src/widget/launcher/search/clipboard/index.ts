import Cliphist from "src/services/cliphist";

export interface ClipboardButtonResult {
  entry: ClipboardEntry;
  index: number;
}

export interface ClipboardEntry {
  content: string;
  timestamp: number;
  type: "text" | "image" | "file";
  preview?: string;
  id?: string;
  imagePath?: string; // Path to saved image for image entries
  thumbnailPath?: string; // Path to cached square thumbnail
}


export default function getClipboardResults(searchText: string, isPrefixSearch: boolean = false): ClipboardButtonResult[] {
  const query = searchText.toLowerCase().trim();
  const clipboard = Cliphist.get_default();
  const history = clipboard.list
  console.debug("Getting clipboard results", { query, isPrefixSearch, historyCount: history.length });

  // If empty query with prefix, show recent clipboard entries
  if (isPrefixSearch && query === '') {
    return history().slice(0, 10).map((entry, index) => ({
      entry,
      index
    }));
  }

  // Filter clipboard entries based on query
  const filtered = history.filter(entry => {
    const searchTarget = entry.preview?.toLowerCase() || entry.content.toLowerCase();

    // Split query into words for better matching
    const queryWords = query.split(/\s+/);
    return queryWords.every(word => searchTarget.includes(word));
  });

  log.debug("Clipboard results", { query, resultCount: filtered.length });

  return filtered.slice(0, 10).map((entry, index) => ({
    entry,
    index
  }));
}
