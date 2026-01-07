import type { LanguageOption } from "./types.js";

/**
 * All supported programming languages
 * This is the single source of truth - both CLI and WebUI import from here
 */
export const LANGUAGES: LanguageOption[] = [
  // Popular
  { id: "typescript", label: "TypeScript", icon: "📘" },
  { id: "javascript", label: "JavaScript", icon: "📒" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "go", label: "Go", icon: "🐹" },
  { id: "rust", label: "Rust", icon: "🦀" },
  { id: "java", label: "Java", icon: "☕" },
  { id: "csharp", label: "C#", icon: "🎯" },
  { id: "php", label: "PHP", icon: "🐘" },
  { id: "ruby", label: "Ruby", icon: "💎" },
  { id: "swift", label: "Swift", icon: "🍎" },
  { id: "kotlin", label: "Kotlin", icon: "🎨" },
  { id: "cpp", label: "C++", icon: "⚙️" },
  // Additional
  { id: "c", label: "C", icon: "🔧" },
  { id: "scala", label: "Scala", icon: "🔴" },
  { id: "elixir", label: "Elixir", icon: "💧" },
  { id: "clojure", label: "Clojure", icon: "🔮" },
  { id: "haskell", label: "Haskell", icon: "λ" },
  { id: "fsharp", label: "F#", icon: "🟦" },
  { id: "dart", label: "Dart", icon: "🎯" },
  { id: "lua", label: "Lua", icon: "🌙" },
  { id: "perl", label: "Perl", icon: "🐪" },
  { id: "r", label: "R", icon: "📊" },
  { id: "julia", label: "Julia", icon: "🔬" },
  { id: "zig", label: "Zig", icon: "⚡" },
  { id: "nim", label: "Nim", icon: "👑" },
  { id: "ocaml", label: "OCaml", icon: "🐫" },
  { id: "erlang", label: "Erlang", icon: "📞" },
  { id: "groovy", label: "Groovy", icon: "🎵" },
  { id: "objectivec", label: "Objective-C", icon: "📱" },
  { id: "shell", label: "Shell/Bash", icon: "🐚" },
  { id: "powershell", label: "PowerShell", icon: "💻" },
  { id: "sql", label: "SQL", icon: "🗃️" },
  // Blockchain
  { id: "solidity", label: "Solidity", icon: "⛓️" },
  { id: "move", label: "Move", icon: "🔒" },
  { id: "cairo", label: "Cairo", icon: "🏛️" },
  { id: "wasm", label: "WebAssembly", icon: "🌐" },
];

/**
 * Get language IDs for filtering
 */
export const LANGUAGE_IDS = LANGUAGES.map(l => l.id);

