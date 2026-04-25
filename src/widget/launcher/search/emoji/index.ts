// Emoji search — no external deps, pure in-memory dataset.
// Searches by name, aliases, keywords, and category.

export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
  category: string;
}

export interface EmojiButtonResult {
  entry: EmojiEntry;
  index: number;
}

// ─── Dataset ────────────────────────────────────────────────────────────────
// Extend this list as needed. Grouped by category for easy maintenance.
const EMOJI_DATA: EmojiEntry[] = [
  // Faces & People
  { emoji: "😀", name: "grinning face", keywords: ["happy", "smile", "grin"], category: "faces" },
  { emoji: "😂", name: "face with tears of joy", keywords: ["lol", "laugh", "crying", "funny"], category: "faces" },
  { emoji: "😊", name: "smiling face", keywords: ["happy", "blush", "smile"], category: "faces" },
  { emoji: "😍", name: "heart eyes", keywords: ["love", "crush", "beautiful"], category: "faces" },
  { emoji: "🤔", name: "thinking face", keywords: ["think", "hmm", "wondering", "ponder"], category: "faces" },
  { emoji: "😭", name: "loudly crying face", keywords: ["sad", "cry", "sob", "tears"], category: "faces" },
  { emoji: "😎", name: "smiling face with sunglasses", keywords: ["cool", "awesome", "sunglasses"], category: "faces" },
  { emoji: "🥺", name: "pleading face", keywords: ["please", "cute", "puppy eyes", "beg"], category: "faces" },
  { emoji: "😴", name: "sleeping face", keywords: ["sleep", "tired", "zzz", "bored"], category: "faces" },
  { emoji: "🤣", name: "rolling on floor laughing", keywords: ["rofl", "funny", "laugh"], category: "faces" },
  { emoji: "😤", name: "face with steam from nose", keywords: ["angry", "frustrated", "annoyed"], category: "faces" },
  { emoji: "🥳", name: "partying face", keywords: ["party", "celebrate", "birthday", "fun"], category: "faces" },
  { emoji: "😬", name: "grimacing face", keywords: ["awkward", "nervous", "cringe", "oops"], category: "faces" },
  { emoji: "🤯", name: "exploding head", keywords: ["mind blown", "shocked", "wow"], category: "faces" },
  { emoji: "🫡", name: "saluting face", keywords: ["salute", "yes sir", "respect"], category: "faces" },
  { emoji: "🫠", name: "melting face", keywords: ["melt", "hot", "embarrassed"], category: "faces" },
  { emoji: "👀", name: "eyes", keywords: ["looking", "watching", "stare", "peek"], category: "faces" },
  { emoji: "👋", name: "waving hand", keywords: ["wave", "hi", "hello", "bye"], category: "people" },
  { emoji: "👍", name: "thumbs up", keywords: ["good", "ok", "yes", "like", "approve"], category: "people" },
  { emoji: "👎", name: "thumbs down", keywords: ["bad", "no", "dislike", "disapprove"], category: "people" },
  { emoji: "🙏", name: "folded hands", keywords: ["pray", "please", "thanks", "namaste"], category: "people" },
  { emoji: "💪", name: "flexed biceps", keywords: ["strong", "muscle", "workout", "power"], category: "people" },
  { emoji: "🤝", name: "handshake", keywords: ["deal", "agree", "partnership", "meeting"], category: "people" },
  { emoji: "✌️", name: "victory hand", keywords: ["peace", "two", "victory"], category: "people" },

  // Nature
  { emoji: "🔥", name: "fire", keywords: ["hot", "flame", "lit", "burn", "spicy"], category: "nature" },
  { emoji: "⭐", name: "star", keywords: ["star", "favorite", "like", "rate"], category: "nature" },
  { emoji: "💧", name: "droplet", keywords: ["water", "drop", "liquid", "blue"], category: "nature" },
  { emoji: "🌈", name: "rainbow", keywords: ["color", "pride", "beautiful", "weather"], category: "nature" },
  { emoji: "❄️", name: "snowflake", keywords: ["cold", "winter", "snow", "ice", "freeze"], category: "nature" },
  { emoji: "🌙", name: "crescent moon", keywords: ["moon", "night", "sleep", "dark"], category: "nature" },
  { emoji: "☀️", name: "sun", keywords: ["sunny", "hot", "day", "bright", "weather"], category: "nature" },
  { emoji: "⚡", name: "lightning", keywords: ["thunder", "storm", "electric", "fast", "zap"], category: "nature" },
  { emoji: "🌊", name: "wave", keywords: ["ocean", "sea", "surf", "water"], category: "nature" },

  // Food & Drink
  { emoji: "🍕", name: "pizza", keywords: ["food", "italian", "cheese", "slice"], category: "food" },
  { emoji: "🍺", name: "beer", keywords: ["drink", "beer", "alcohol", "pub", "cheers"], category: "food" },
  { emoji: "☕", name: "coffee", keywords: ["coffee", "hot", "morning", "cafe", "espresso"], category: "food" },
  { emoji: "🍣", name: "sushi", keywords: ["japanese", "food", "fish", "rice"], category: "food" },
  { emoji: "🍔", name: "hamburger", keywords: ["burger", "fast food", "beef", "lunch"], category: "food" },
  { emoji: "🍰", name: "cake", keywords: ["cake", "sweet", "birthday", "dessert"], category: "food" },

  // Symbols & UI
  { emoji: "✅", name: "check mark button", keywords: ["done", "yes", "ok", "complete", "tick"], category: "symbols" },
  { emoji: "❌", name: "cross mark", keywords: ["no", "wrong", "delete", "close", "error"], category: "symbols" },
  { emoji: "⚠️", name: "warning", keywords: ["warn", "caution", "alert", "danger"], category: "symbols" },
  { emoji: "💡", name: "light bulb", keywords: ["idea", "tip", "hint", "suggestion"], category: "symbols" },
  { emoji: "🔗", name: "link", keywords: ["link", "url", "chain", "connect"], category: "symbols" },
  { emoji: "📌", name: "pushpin", keywords: ["pin", "save", "note", "important", "mark"], category: "symbols" },
  { emoji: "🔒", name: "locked", keywords: ["lock", "secure", "private", "password"], category: "symbols" },
  { emoji: "🔓", name: "unlocked", keywords: ["unlock", "open", "public"], category: "symbols" },
  { emoji: "📋", name: "clipboard", keywords: ["copy", "paste", "clipboard", "note"], category: "symbols" },
  { emoji: "📝", name: "memo", keywords: ["note", "write", "edit", "todo", "list"], category: "symbols" },
  { emoji: "🔍", name: "magnifying glass", keywords: ["search", "find", "look", "zoom"], category: "symbols" },
  { emoji: "⚙️", name: "gear", keywords: ["settings", "config", "options", "tools"], category: "symbols" },
  { emoji: "🗑️", name: "wastebasket", keywords: ["delete", "trash", "remove", "bin"], category: "symbols" },
  { emoji: "📦", name: "package", keywords: ["box", "package", "bundle", "deploy"], category: "symbols" },
  { emoji: "🚀", name: "rocket", keywords: ["launch", "deploy", "fast", "startup"], category: "symbols" },
  { emoji: "💬", name: "speech bubble", keywords: ["chat", "message", "comment", "talk"], category: "symbols" },
  { emoji: "❤️", name: "red heart", keywords: ["love", "like", "favorite", "heart"], category: "symbols" },
  { emoji: "💯", name: "hundred points", keywords: ["100", "perfect", "score", "complete"], category: "symbols" },
  { emoji: "🎉", name: "party popper", keywords: ["celebrate", "party", "congrats", "yay"], category: "symbols" },
  { emoji: "👏", name: "clapping hands", keywords: ["clap", "applause", "congrats", "bravo"], category: "symbols" },

  // Tech / Dev
  { emoji: "💻", name: "laptop", keywords: ["computer", "code", "work", "dev", "pc"], category: "tech" },
  { emoji: "🖥️", name: "desktop computer", keywords: ["computer", "monitor", "screen", "desktop"], category: "tech" },
  { emoji: "🖱️", name: "computer mouse", keywords: ["mouse", "click", "cursor", "computer"], category: "tech" },
  { emoji: "⌨️", name: "keyboard", keywords: ["type", "keyboard", "input", "keys"], category: "tech" },
  { emoji: "📱", name: "mobile phone", keywords: ["phone", "mobile", "app", "smartphone"], category: "tech" },
  { emoji: "🤖", name: "robot", keywords: ["ai", "bot", "robot", "automation", "ml"], category: "tech" },
  { emoji: "🐛", name: "bug", keywords: ["bug", "error", "issue", "debug", "fix"], category: "tech" },
  { emoji: "🧠", name: "brain", keywords: ["smart", "think", "ai", "mind", "memory"], category: "tech" },
  { emoji: "📊", name: "bar chart", keywords: ["chart", "graph", "data", "stats", "analytics"], category: "tech" },
  { emoji: "🗄️", name: "file cabinet", keywords: ["database", "storage", "files", "server"], category: "tech" },
  { emoji: "🔧", name: "wrench", keywords: ["fix", "tool", "repair", "build", "config"], category: "tech" },
  { emoji: "🔨", name: "hammer", keywords: ["build", "compile", "make", "tool"], category: "tech" },
  { emoji: "📡", name: "satellite antenna", keywords: ["network", "signal", "wifi", "connect"], category: "tech" },
  { emoji: "🐙", name: "octopus", keywords: ["github", "git", "octopus", "tentacle"], category: "tech" },
  { emoji: "🦀", name: "crab", keywords: ["rust", "crab", "programming"], category: "tech" },
  { emoji: "🐍", name: "snake", keywords: ["python", "snake", "programming"], category: "tech" },
  { emoji: "☁️", name: "cloud", keywords: ["cloud", "server", "aws", "storage", "upload"], category: "tech" },
  { emoji: "🌐", name: "globe with meridians", keywords: ["web", "internet", "global", "network", "www"], category: "tech" },
  { emoji: "📂", name: "open file folder", keywords: ["folder", "directory", "files", "open"], category: "tech" },
  { emoji: "🔑", name: "key", keywords: ["key", "auth", "password", "access", "token"], category: "tech" },
];

// ─── Fuzzy / keyword matching ────────────────────────────────────────────────
function score(entry: EmojiEntry, query: string): number {
  const q = query.toLowerCase();
  const name = entry.name.toLowerCase();

  // Exact match on name → highest score
  if (name === q) return 100;
  // Exact keyword match
  if (entry.keywords.includes(q)) return 90;
  // Name starts with query
  if (name.startsWith(q)) return 80;
  // Keyword starts with query
  if (entry.keywords.some(k => k.startsWith(q))) return 70;
  // Name contains query
  if (name.includes(q)) return 60;
  // Keyword contains query
  if (entry.keywords.some(k => k.includes(q))) return 50;
  // Category match
  if (entry.category === q) return 40;
  return 0;
}

export default function getEmojiResults(
  searchText: string,
  _isPrefixSearch: boolean = false
): EmojiButtonResult[] {
  const query = searchText.trim();

  // Empty query → return popular / top emojis
  if (!query) {
    return EMOJI_DATA.slice(0, 10).map((entry, index) => ({ entry, index }));
  }

  // Score and filter
  const scored = EMOJI_DATA
    .map(entry => ({ entry, s: score(entry, query) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);

  return scored
    .slice(0, 10)
    .map(({ entry }, index) => ({ entry, index }));
}

