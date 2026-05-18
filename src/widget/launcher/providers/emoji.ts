import type { EmojiEntry } from "../types"

export type { EmojiEntry }
export interface EmojiResult { entry: EmojiEntry }

const EMOJI_DATA: EmojiEntry[] = [
  // Faces
  { emoji: "😀", name: "grinning face",              keywords: ["happy", "smile", "grin"],              category: "faces" },
  { emoji: "😂", name: "face with tears of joy",     keywords: ["lol", "laugh", "crying", "funny"],     category: "faces" },
  { emoji: "😊", name: "smiling face",               keywords: ["happy", "blush", "smile"],             category: "faces" },
  { emoji: "😍", name: "heart eyes",                 keywords: ["love", "crush", "beautiful"],          category: "faces" },
  { emoji: "🤔", name: "thinking face",              keywords: ["think", "hmm", "wondering", "ponder"], category: "faces" },
  { emoji: "😭", name: "loudly crying face",         keywords: ["sad", "cry", "sob", "tears"],          category: "faces" },
  { emoji: "😎", name: "smiling face with sunglasses", keywords: ["cool", "awesome", "sunglasses"],     category: "faces" },
  { emoji: "🥺", name: "pleading face",              keywords: ["please", "cute", "puppy eyes", "beg"], category: "faces" },
  { emoji: "😴", name: "sleeping face",              keywords: ["sleep", "tired", "zzz", "bored"],      category: "faces" },
  { emoji: "🤣", name: "rolling on floor laughing",  keywords: ["rofl", "funny", "laugh"],              category: "faces" },
  { emoji: "😤", name: "face with steam from nose",  keywords: ["angry", "frustrated", "annoyed"],      category: "faces" },
  { emoji: "🥳", name: "partying face",              keywords: ["party", "celebrate", "birthday", "fun"], category: "faces" },
  { emoji: "😬", name: "grimacing face",             keywords: ["awkward", "nervous", "cringe", "oops"], category: "faces" },
  { emoji: "🤯", name: "exploding head",             keywords: ["mind blown", "shocked", "wow"],        category: "faces" },
  { emoji: "🫡", name: "saluting face",              keywords: ["salute", "yes sir", "respect"],        category: "faces" },
  { emoji: "🫠", name: "melting face",               keywords: ["melt", "hot", "embarrassed"],          category: "faces" },
  { emoji: "👀", name: "eyes",                       keywords: ["looking", "watching", "stare", "peek"], category: "faces" },
  // People
  { emoji: "👋", name: "waving hand",                keywords: ["wave", "hi", "hello", "bye"],          category: "people" },
  { emoji: "👍", name: "thumbs up",                  keywords: ["good", "ok", "yes", "like", "approve"], category: "people" },
  { emoji: "👎", name: "thumbs down",                keywords: ["bad", "no", "dislike", "disapprove"],  category: "people" },
  { emoji: "🙏", name: "folded hands",               keywords: ["pray", "please", "thanks", "namaste"], category: "people" },
  { emoji: "💪", name: "flexed biceps",              keywords: ["strong", "muscle", "workout", "power"], category: "people" },
  { emoji: "🤝", name: "handshake",                  keywords: ["deal", "agree", "partnership", "meeting"], category: "people" },
  { emoji: "✌️", name: "victory hand",               keywords: ["peace", "two", "victory"],             category: "people" },
  // Nature
  { emoji: "🔥", name: "fire",                       keywords: ["hot", "flame", "lit", "burn", "spicy"], category: "nature" },
  { emoji: "⭐", name: "star",                       keywords: ["star", "favorite", "like", "rate"],    category: "nature" },
  { emoji: "💧", name: "droplet",                    keywords: ["water", "drop", "liquid", "blue"],     category: "nature" },
  { emoji: "🌈", name: "rainbow",                    keywords: ["color", "pride", "beautiful", "weather"], category: "nature" },
  { emoji: "❄️", name: "snowflake",                  keywords: ["cold", "winter", "snow", "ice"],       category: "nature" },
  { emoji: "🌙", name: "crescent moon",              keywords: ["moon", "night", "sleep", "dark"],      category: "nature" },
  { emoji: "☀️", name: "sun",                        keywords: ["sunny", "hot", "day", "bright"],       category: "nature" },
  { emoji: "⚡", name: "lightning",                  keywords: ["thunder", "storm", "electric", "fast"], category: "nature" },
  { emoji: "🌊", name: "wave",                       keywords: ["ocean", "sea", "surf", "water"],       category: "nature" },
  // Food
  { emoji: "🍕", name: "pizza",                      keywords: ["food", "italian", "cheese", "slice"],  category: "food" },
  { emoji: "🍺", name: "beer",                       keywords: ["drink", "alcohol", "pub", "cheers"],   category: "food" },
  { emoji: "☕", name: "coffee",                     keywords: ["hot", "morning", "cafe", "espresso"],  category: "food" },
  { emoji: "🍣", name: "sushi",                      keywords: ["japanese", "food", "fish", "rice"],    category: "food" },
  { emoji: "🍔", name: "hamburger",                  keywords: ["burger", "fast food", "beef", "lunch"], category: "food" },
  { emoji: "🍰", name: "cake",                       keywords: ["sweet", "birthday", "dessert"],        category: "food" },
  // Symbols
  { emoji: "✅", name: "check mark",                 keywords: ["done", "yes", "ok", "complete", "tick"], category: "symbols" },
  { emoji: "❌", name: "cross mark",                 keywords: ["no", "wrong", "delete", "close", "error"], category: "symbols" },
  { emoji: "⚠️", name: "warning",                    keywords: ["warn", "caution", "alert", "danger"], category: "symbols" },
  { emoji: "💡", name: "light bulb",                 keywords: ["idea", "tip", "hint", "suggestion"],   category: "symbols" },
  { emoji: "🔗", name: "link",                       keywords: ["url", "chain", "connect"],             category: "symbols" },
  { emoji: "📌", name: "pushpin",                    keywords: ["pin", "save", "note", "important"],    category: "symbols" },
  { emoji: "🔒", name: "locked",                     keywords: ["lock", "secure", "private", "password"], category: "symbols" },
  { emoji: "🔓", name: "unlocked",                   keywords: ["unlock", "open", "public"],            category: "symbols" },
  { emoji: "📋", name: "clipboard",                  keywords: ["copy", "paste", "note"],               category: "symbols" },
  { emoji: "📝", name: "memo",                       keywords: ["note", "write", "edit", "todo", "list"], category: "symbols" },
  { emoji: "🔍", name: "magnifying glass",           keywords: ["search", "find", "look", "zoom"],      category: "symbols" },
  { emoji: "⚙️", name: "gear",                       keywords: ["settings", "config", "options"],       category: "symbols" },
  { emoji: "🗑️", name: "wastebasket",                keywords: ["delete", "trash", "remove", "bin"],    category: "symbols" },
  { emoji: "📦", name: "package",                    keywords: ["box", "bundle", "deploy"],             category: "symbols" },
  { emoji: "🚀", name: "rocket",                     keywords: ["launch", "deploy", "fast", "startup"], category: "symbols" },
  { emoji: "💬", name: "speech bubble",              keywords: ["chat", "message", "comment", "talk"],  category: "symbols" },
  { emoji: "❤️", name: "red heart",                  keywords: ["love", "like", "favorite"],            category: "symbols" },
  { emoji: "💯", name: "hundred points",             keywords: ["100", "perfect", "score", "complete"], category: "symbols" },
  { emoji: "🎉", name: "party popper",               keywords: ["celebrate", "party", "congrats", "yay"], category: "symbols" },
  { emoji: "👏", name: "clapping hands",             keywords: ["clap", "applause", "congrats", "bravo"], category: "symbols" },
  // Tech
  { emoji: "💻", name: "laptop",                     keywords: ["computer", "code", "work", "dev"],     category: "tech" },
  { emoji: "🖥️", name: "desktop computer",           keywords: ["monitor", "screen", "desktop"],        category: "tech" },
  { emoji: "📱", name: "mobile phone",               keywords: ["phone", "mobile", "app", "smartphone"], category: "tech" },
  { emoji: "🤖", name: "robot",                      keywords: ["ai", "bot", "automation", "ml"],       category: "tech" },
  { emoji: "🐛", name: "bug",                        keywords: ["error", "issue", "debug", "fix"],      category: "tech" },
  { emoji: "🧠", name: "brain",                      keywords: ["smart", "think", "ai", "mind"],        category: "tech" },
  { emoji: "📊", name: "bar chart",                  keywords: ["chart", "graph", "data", "stats"],     category: "tech" },
  { emoji: "🔧", name: "wrench",                     keywords: ["fix", "tool", "repair", "build"],      category: "tech" },
  { emoji: "🔨", name: "hammer",                     keywords: ["build", "compile", "make"],            category: "tech" },
  { emoji: "🐙", name: "octopus",                    keywords: ["github", "git"],                       category: "tech" },
  { emoji: "🦀", name: "crab",                       keywords: ["rust", "programming"],                 category: "tech" },
  { emoji: "🐍", name: "snake",                      keywords: ["python", "programming"],               category: "tech" },
  { emoji: "☁️", name: "cloud",                      keywords: ["server", "aws", "storage", "upload"],  category: "tech" },
  { emoji: "🌐", name: "globe",                      keywords: ["web", "internet", "global", "www"],    category: "tech" },
  { emoji: "📂", name: "open file folder",           keywords: ["folder", "directory", "files"],        category: "tech" },
  { emoji: "🔑", name: "key",                        keywords: ["auth", "password", "access", "token"], category: "tech" },
]

function scoreEntry(entry: EmojiEntry, q: string): number {
  const name = entry.name.toLowerCase()
  if (name === q) return 100
  if (entry.keywords.includes(q)) return 90
  if (name.startsWith(q)) return 80
  if (entry.keywords.some((k) => k.startsWith(q))) return 70
  if (name.includes(q)) return 60
  if (entry.keywords.some((k) => k.includes(q))) return 50
  if (entry.category === q) return 40
  return 0
}

export default function getEmojiResults(query: string, _isPrefixSearch = false): EmojiResult[] {
  const q = query.trim()

  if (!q) {
    return EMOJI_DATA.slice(0, 10).map((entry) => ({ entry }))
  }

  return EMOJI_DATA
    .map((entry) => ({ entry, score: scoreEntry(entry, q.toLowerCase()) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ entry }) => ({ entry }))
}
