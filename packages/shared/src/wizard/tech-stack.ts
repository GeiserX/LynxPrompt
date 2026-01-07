import type { PackageManagerOption, MonorepoToolOption, JsRuntimeOption, OrmOption } from "./types.js";

/**
 * Package managers (JS/TS only)
 */
export const PACKAGE_MANAGERS: PackageManagerOption[] = [
  { id: "npm", label: "npm", icon: "📦", description: "Node Package Manager (default)" },
  { id: "yarn", label: "Yarn", icon: "🧶", description: "Fast, reliable, and secure" },
  { id: "pnpm", label: "pnpm", icon: "📀", description: "Fast, disk space efficient" },
  { id: "bun", label: "Bun", icon: "🥟", description: "All-in-one JS runtime + PM" },
];

/**
 * Monorepo tools (JS/TS only)
 */
export const MONOREPO_TOOLS: MonorepoToolOption[] = [
  { id: "", label: "None", icon: "📁", description: "Single package repository" },
  { id: "turborepo", label: "Turborepo", icon: "⚡", description: "High-performance build system" },
  { id: "nx", label: "Nx", icon: "🔷", description: "Smart, extensible build framework" },
  { id: "lerna", label: "Lerna", icon: "🐉", description: "Multi-package repositories" },
  { id: "pnpm_workspaces", label: "pnpm Workspaces", icon: "📀", description: "Native pnpm monorepo" },
  { id: "yarn_workspaces", label: "Yarn Workspaces", icon: "🧶", description: "Native Yarn monorepo" },
  { id: "npm_workspaces", label: "npm Workspaces", icon: "📦", description: "Native npm monorepo" },
  { id: "rush", label: "Rush", icon: "🚀", description: "Microsoft's scalable monorepo" },
  { id: "moon", label: "moon", icon: "🌙", description: "Repository management tool" },
];

/**
 * JS/TS runtimes
 */
export const JS_RUNTIMES: JsRuntimeOption[] = [
  { id: "node", label: "Node.js", icon: "🟢", description: "Standard JavaScript runtime" },
  { id: "deno", label: "Deno", icon: "🦕", description: "Secure runtime with TypeScript" },
  { id: "bun", label: "Bun", icon: "🥟", description: "Fast all-in-one JS runtime" },
];

/**
 * ORMs and Database tools
 */
export const ORM_OPTIONS: OrmOption[] = [
  { id: "", label: "None / Raw SQL", icon: "📝" },
  // JavaScript/TypeScript
  { id: "prisma", label: "Prisma", icon: "🔷", languages: ["typescript", "javascript"] },
  { id: "drizzle", label: "Drizzle", icon: "💧", languages: ["typescript", "javascript"] },
  { id: "typeorm", label: "TypeORM", icon: "🔶", languages: ["typescript", "javascript"] },
  { id: "sequelize", label: "Sequelize", icon: "📘", languages: ["typescript", "javascript"] },
  { id: "knex", label: "Knex.js", icon: "🔧", languages: ["typescript", "javascript"] },
  { id: "kysely", label: "Kysely", icon: "🎯", languages: ["typescript", "javascript"] },
  { id: "mikro-orm", label: "MikroORM", icon: "🔵", languages: ["typescript", "javascript"] },
  { id: "objection", label: "Objection.js", icon: "📊", languages: ["typescript", "javascript"] },
  // Python
  { id: "sqlalchemy", label: "SQLAlchemy", icon: "🐍", languages: ["python"] },
  { id: "django_orm", label: "Django ORM", icon: "🎸", languages: ["python"] },
  { id: "tortoise", label: "Tortoise ORM", icon: "🐢", languages: ["python"] },
  { id: "sqlmodel", label: "SQLModel", icon: "⚡", languages: ["python"] },
  { id: "peewee", label: "Peewee", icon: "🐦", languages: ["python"] },
  // Go
  { id: "gorm", label: "GORM", icon: "🐹", languages: ["go"] },
  { id: "ent", label: "Ent", icon: "🏗️", languages: ["go"] },
  { id: "sqlc", label: "sqlc", icon: "📝", languages: ["go"] },
  { id: "bun_go", label: "Bun (Go)", icon: "🥟", languages: ["go"] },
  // Rust
  { id: "diesel", label: "Diesel", icon: "🦀", languages: ["rust"] },
  { id: "sea-orm", label: "SeaORM", icon: "🌊", languages: ["rust"] },
  { id: "sqlx", label: "SQLx", icon: "📦", languages: ["rust"] },
  // Java/Kotlin
  { id: "hibernate", label: "Hibernate", icon: "☕", languages: ["java", "kotlin"] },
  { id: "jooq", label: "jOOQ", icon: "🎵", languages: ["java", "kotlin"] },
  { id: "exposed", label: "Exposed", icon: "🎨", languages: ["kotlin"] },
  // .NET
  { id: "ef_core", label: "Entity Framework", icon: "🔷", languages: ["csharp"] },
  { id: "dapper", label: "Dapper", icon: "⚡", languages: ["csharp"] },
  // Ruby
  { id: "activerecord", label: "ActiveRecord", icon: "💎", languages: ["ruby"] },
  { id: "sequel", label: "Sequel", icon: "📚", languages: ["ruby"] },
  // PHP
  { id: "eloquent", label: "Eloquent", icon: "🐘", languages: ["php"] },
  { id: "doctrine", label: "Doctrine", icon: "📖", languages: ["php"] },
];

/**
 * Get ORMs filtered by language
 */
export const getOrmsByLanguage = (languages: string[]) =>
  ORM_OPTIONS.filter(o => !o.languages || o.languages.some(l => languages.includes(l)));



