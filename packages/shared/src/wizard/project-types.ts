import type { ProjectTypeOption, ArchitectureOption, DevOsOption } from "./types.js";

/**
 * Project types
 */
export const PROJECT_TYPES: ProjectTypeOption[] = [
  { id: "web_frontend", label: "Web Frontend", icon: "🌐", description: "React, Vue, Angular, etc." },
  { id: "web_fullstack", label: "Full-stack Web", icon: "🖥️", description: "Next.js, Nuxt, SvelteKit, etc." },
  { id: "api_backend", label: "API / Backend", icon: "⚙️", description: "REST, GraphQL, gRPC services" },
  { id: "cli_tool", label: "CLI Tool", icon: "💻", description: "Command-line applications" },
  { id: "library", label: "Library / Package", icon: "📦", description: "Reusable npm/pip/cargo package" },
  { id: "mobile", label: "Mobile App", icon: "📱", description: "React Native, Flutter, native" },
  { id: "desktop", label: "Desktop App", icon: "🖥️", description: "Electron, Tauri, native" },
  { id: "microservice", label: "Microservice", icon: "🔧", description: "Single-purpose service" },
  { id: "monolith", label: "Monolith", icon: "🏢", description: "All-in-one application" },
  { id: "data_science", label: "Data Science", icon: "📊", description: "ML, analytics, notebooks" },
  { id: "devops", label: "DevOps / IaC", icon: "🔄", description: "Terraform, Ansible, K8s manifests" },
  { id: "game", label: "Game", icon: "🎮", description: "Unity, Godot, web games" },
  { id: "embedded", label: "Embedded / IoT", icon: "🔌", description: "Firmware, hardware control" },
  { id: "blockchain", label: "Blockchain / Web3", icon: "⛓️", description: "Smart contracts, dApps" },
  { id: "other", label: "Other", icon: "📁", description: "Custom project type" },
];

/**
 * Architecture patterns
 */
export const ARCHITECTURE_PATTERNS: ArchitectureOption[] = [
  { id: "mvc", label: "MVC", description: "Model-View-Controller" },
  { id: "mvvm", label: "MVVM", description: "Model-View-ViewModel" },
  { id: "clean", label: "Clean Architecture", description: "Dependency rule, use cases" },
  { id: "hexagonal", label: "Hexagonal / Ports & Adapters", description: "Domain-centric, pluggable" },
  { id: "ddd", label: "Domain-Driven Design", description: "Bounded contexts, aggregates" },
  { id: "microservices", label: "Microservices", description: "Distributed services" },
  { id: "serverless", label: "Serverless", description: "FaaS, event-driven" },
  { id: "event_driven", label: "Event-Driven", description: "Event sourcing, CQRS" },
  { id: "modular_monolith", label: "Modular Monolith", description: "Organized monolith" },
  { id: "layered", label: "Layered / N-Tier", description: "Presentation, business, data" },
  { id: "component_based", label: "Component-Based", description: "React, Vue components" },
  { id: "plugin", label: "Plugin Architecture", description: "Extensible core + plugins" },
  { id: "other", label: "Other", description: "Custom architecture" },
];

/**
 * Development OS options
 */
export const DEV_OS_OPTIONS: DevOsOption[] = [
  { id: "macos", label: "macOS", icon: "🍎" },
  { id: "linux", label: "Linux", icon: "🐧" },
  { id: "windows", label: "Windows", icon: "🪟" },
  { id: "wsl", label: "WSL", icon: "🐧" },
];



