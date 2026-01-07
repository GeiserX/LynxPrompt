import type { FrameworkOption } from "./types.js";

/**
 * All supported frameworks
 * This is the single source of truth - both CLI and WebUI import from here
 */
export const FRAMEWORKS: FrameworkOption[] = [
  // Frontend
  { id: "react", label: "React", icon: "⚛️" },
  { id: "nextjs", label: "Next.js", icon: "▲" },
  { id: "vue", label: "Vue.js", icon: "💚" },
  { id: "nuxt", label: "Nuxt.js", icon: "💚" },
  { id: "angular", label: "Angular", icon: "🅰️" },
  { id: "svelte", label: "Svelte", icon: "🔥" },
  { id: "sveltekit", label: "SvelteKit", icon: "🔥" },
  { id: "solid", label: "SolidJS", icon: "💎" },
  { id: "qwik", label: "Qwik", icon: "⚡" },
  { id: "astro", label: "Astro", icon: "🚀" },
  { id: "remix", label: "Remix", icon: "💿" },
  { id: "gatsby", label: "Gatsby", icon: "🟣" },
  // Backend Node
  { id: "express", label: "Express.js", icon: "📦" },
  { id: "nestjs", label: "NestJS", icon: "🐱" },
  { id: "fastify", label: "Fastify", icon: "🚀" },
  { id: "hono", label: "Hono", icon: "🔥" },
  { id: "koa", label: "Koa", icon: "🌿" },
  // Python
  { id: "fastapi", label: "FastAPI", icon: "⚡" },
  { id: "django", label: "Django", icon: "🎸" },
  { id: "flask", label: "Flask", icon: "🌶️" },
  { id: "starlette", label: "Starlette", icon: "⭐" },
  { id: "tornado", label: "Tornado", icon: "🌪️" },
  { id: "pyramid", label: "Pyramid", icon: "🔺" },
  // Java/Kotlin
  { id: "spring", label: "Spring Boot", icon: "🌱" },
  { id: "quarkus", label: "Quarkus", icon: "🔷" },
  { id: "micronaut", label: "Micronaut", icon: "🔵" },
  { id: "ktor", label: "Ktor", icon: "🎨" },
  // .NET
  { id: "dotnet", label: ".NET", icon: "🔷" },
  { id: "blazor", label: "Blazor", icon: "🔷" },
  // Ruby
  { id: "rails", label: "Ruby on Rails", icon: "🛤️" },
  { id: "sinatra", label: "Sinatra", icon: "🎤" },
  { id: "hanami", label: "Hanami", icon: "🌸" },
  // Go
  { id: "gin", label: "Gin", icon: "🍸" },
  { id: "fiber", label: "Fiber", icon: "⚡" },
  { id: "echo", label: "Echo", icon: "📣" },
  { id: "chi", label: "Chi", icon: "🐹" },
  // Rust
  { id: "actix", label: "Actix", icon: "🦀" },
  { id: "axum", label: "Axum", icon: "🦀" },
  { id: "rocket", label: "Rocket", icon: "🚀" },
  { id: "warp", label: "Warp", icon: "🦀" },
  // PHP
  { id: "laravel", label: "Laravel", icon: "🔴" },
  { id: "symfony", label: "Symfony", icon: "🎵" },
  { id: "lumen", label: "Lumen", icon: "💡" },
  { id: "codeigniter", label: "CodeIgniter", icon: "🔥" },
  // Mobile
  { id: "react-native", label: "React Native", icon: "📱" },
  { id: "flutter", label: "Flutter", icon: "🐦" },
  { id: "ionic", label: "Ionic", icon: "⚡" },
  { id: "expo", label: "Expo", icon: "📱" },
  // Desktop
  { id: "electron", label: "Electron", icon: "⚡" },
  { id: "tauri", label: "Tauri", icon: "🦀" },
  // Tools/Build
  { id: "vite", label: "Vite", icon: "⚡" },
  { id: "webpack", label: "Webpack", icon: "📦" },
  { id: "esbuild", label: "esbuild", icon: "📦" },
  { id: "turbopack", label: "Turbopack", icon: "⚡" },
  // CSS
  { id: "tailwind", label: "Tailwind CSS", icon: "🌊" },
  { id: "bootstrap", label: "Bootstrap", icon: "🅱️" },
  { id: "material-ui", label: "Material UI", icon: "🎨" },
  { id: "chakra", label: "Chakra UI", icon: "⚡" },
  { id: "shadcn", label: "shadcn/ui", icon: "🎨" },
  // Testing
  { id: "jest", label: "Jest", icon: "🃏" },
  { id: "vitest", label: "Vitest", icon: "⚡" },
  { id: "playwright", label: "Playwright", icon: "🎭" },
  { id: "cypress", label: "Cypress", icon: "🌲" },
  // Data
  { id: "prisma", label: "Prisma", icon: "🔷" },
  { id: "drizzle", label: "Drizzle", icon: "💧" },
  { id: "graphql", label: "GraphQL", icon: "◈" },
  { id: "trpc", label: "tRPC", icon: "🔷" },
];

/**
 * Get framework IDs for filtering
 */
export const FRAMEWORK_IDS = FRAMEWORKS.map(f => f.id);

