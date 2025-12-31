"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AiEditPanel } from "@/components/ai-edit-panel";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Download,
  FileText,
  GitBranch,
  Lock,
  LogIn,
  MessageSquare,
  Settings,
  Loader2,
  Search,
  Plus,
  Sparkles,
  Wand2,
  Code,
  Shield,
  ClipboardList,
  User,
  Share2,
  X,
  Save,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CodeEditor } from "@/components/code-editor";
import { Logo } from "@/components/logo";
import {
  generateConfigFiles,
  downloadConfigFile,
  generateAllFiles,
  type GeneratedFile,
} from "@/lib/file-generator";

type WizardTier = "basic" | "intermediate" | "advanced";

const WIZARD_STEPS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: WizardTier;
}[] = [
  { id: "project", title: "Project Basics", icon: Sparkles, tier: "basic" },
  { id: "tech", title: "Tech Stack", icon: Code, tier: "basic" },
  { id: "repo", title: "Repository Setup", icon: GitBranch, tier: "basic" },
  { id: "commands", title: "Commands", icon: ClipboardList, tier: "intermediate" },
  { id: "code_style", title: "Code Style", icon: Wand2, tier: "intermediate" },
  { id: "ai", title: "AI Behavior", icon: Brain, tier: "basic" },
  { id: "boundaries", title: "Boundaries", icon: Shield, tier: "advanced" },
  { id: "testing", title: "Testing Strategy", icon: Shield, tier: "advanced" },
  { id: "static", title: "Static Files", icon: FileText, tier: "advanced" },
  { id: "extra", title: "Anything Else?", icon: MessageSquare, tier: "basic" },
  { id: "generate", title: "Generate", icon: Download, tier: "basic" },
];

// Precomputed widths (Tailwind-safe arbitrary values) for the mobile progress bar
const MOBILE_PROGRESS_WIDTHS = [
  "w-[9%]",
  "w-[18%]",
  "w-[27%]",
  "w-[36%]",
  "w-[45%]",
  "w-[55%]",
  "w-[64%]",
  "w-[73%]",
  "w-[82%]",
  "w-[91%]",
  "w-[100%]",
];

function getTierBadge(tier: WizardTier) {
  switch (tier) {
    case "intermediate":
      return { label: "Pro", className: "bg-blue-500/10 text-blue-500" };
    case "advanced":
      return { label: "Max", className: "bg-purple-500/10 text-purple-500" };
    default:
      return null;
  }
}

function canAccessTier(userTier: string, requiredTier: WizardTier): boolean {
  const tierLevels = { free: 0, pro: 1, max: 2 };
  const requiredLevels = { basic: 0, intermediate: 1, advanced: 2 };
  return tierLevels[userTier as keyof typeof tierLevels] >= requiredLevels[requiredTier];
}

const LANGUAGES = [
  // Popular
  { value: "typescript", label: "TypeScript", icon: "📘" },
  { value: "javascript", label: "JavaScript", icon: "📒" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "go", label: "Go", icon: "🐹" },
  { value: "rust", label: "Rust", icon: "🦀" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "csharp", label: "C#", icon: "🎯" },
  { value: "php", label: "PHP", icon: "🐘" },
  { value: "ruby", label: "Ruby", icon: "💎" },
  { value: "swift", label: "Swift", icon: "🍎" },
  { value: "kotlin", label: "Kotlin", icon: "🎨" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  // Additional
  { value: "c", label: "C", icon: "🔧" },
  { value: "scala", label: "Scala", icon: "🔴" },
  { value: "elixir", label: "Elixir", icon: "💧" },
  { value: "clojure", label: "Clojure", icon: "🔮" },
  { value: "haskell", label: "Haskell", icon: "λ" },
  { value: "fsharp", label: "F#", icon: "🟦" },
  { value: "dart", label: "Dart", icon: "🎯" },
  { value: "lua", label: "Lua", icon: "🌙" },
  { value: "perl", label: "Perl", icon: "🐪" },
  { value: "r", label: "R", icon: "📊" },
  { value: "julia", label: "Julia", icon: "🔬" },
  { value: "zig", label: "Zig", icon: "⚡" },
  { value: "nim", label: "Nim", icon: "👑" },
  { value: "ocaml", label: "OCaml", icon: "🐫" },
  { value: "erlang", label: "Erlang", icon: "📞" },
  { value: "groovy", label: "Groovy", icon: "🎵" },
  { value: "objectivec", label: "Objective-C", icon: "📱" },
  { value: "shell", label: "Shell/Bash", icon: "🐚" },
  { value: "powershell", label: "PowerShell", icon: "💻" },
  { value: "sql", label: "SQL", icon: "🗃️" },
  // Blockchain
  { value: "solidity", label: "Solidity", icon: "⛓️" },
  { value: "move", label: "Move", icon: "🔒" },
  { value: "cairo", label: "Cairo", icon: "🏛️" },
  { value: "wasm", label: "WebAssembly", icon: "🌐" },
  // IaC & DevOps Languages
  { value: "hcl", label: "HCL (Terraform)", icon: "🏗️" },
  { value: "yaml", label: "YAML", icon: "📄" },
  { value: "jsonnet", label: "Jsonnet", icon: "🔧" },
  { value: "dhall", label: "Dhall", icon: "⚙️" },
  { value: "cue", label: "CUE", icon: "🔷" },
  { value: "starlark", label: "Starlark", icon: "⭐" },
  { value: "rego", label: "Rego (OPA)", icon: "🛡️" },
  { value: "nix", label: "Nix", icon: "❄️" },
];

const FRAMEWORKS = [
  // Frontend
  { value: "react", label: "React", icon: "⚛️" },
  { value: "nextjs", label: "Next.js", icon: "▲" },
  { value: "vue", label: "Vue.js", icon: "💚" },
  { value: "nuxt", label: "Nuxt.js", icon: "💚" },
  { value: "angular", label: "Angular", icon: "🅰️" },
  { value: "svelte", label: "Svelte", icon: "🔥" },
  { value: "sveltekit", label: "SvelteKit", icon: "🔥" },
  { value: "solid", label: "SolidJS", icon: "💎" },
  { value: "qwik", label: "Qwik", icon: "⚡" },
  { value: "astro", label: "Astro", icon: "🚀" },
  { value: "remix", label: "Remix", icon: "💿" },
  { value: "gatsby", label: "Gatsby", icon: "🟣" },
  // Backend Node
  { value: "express", label: "Express.js", icon: "📦" },
  { value: "nestjs", label: "NestJS", icon: "🐱" },
  { value: "fastify", label: "Fastify", icon: "🚀" },
  { value: "hono", label: "Hono", icon: "🔥" },
  { value: "koa", label: "Koa", icon: "🌿" },
  // Python
  { value: "fastapi", label: "FastAPI", icon: "⚡" },
  { value: "django", label: "Django", icon: "🎸" },
  { value: "flask", label: "Flask", icon: "🌶️" },
  { value: "starlette", label: "Starlette", icon: "⭐" },
  { value: "tornado", label: "Tornado", icon: "🌪️" },
  { value: "pyramid", label: "Pyramid", icon: "🔺" },
  // Java/Kotlin
  { value: "spring", label: "Spring Boot", icon: "🌱" },
  { value: "quarkus", label: "Quarkus", icon: "🔷" },
  { value: "micronaut", label: "Micronaut", icon: "🔵" },
  { value: "ktor", label: "Ktor", icon: "🎨" },
  // .NET
  { value: "dotnet", label: ".NET", icon: "🔷" },
  { value: "blazor", label: "Blazor", icon: "🔷" },
  // Ruby
  { value: "rails", label: "Ruby on Rails", icon: "🛤️" },
  { value: "sinatra", label: "Sinatra", icon: "🎤" },
  { value: "hanami", label: "Hanami", icon: "🌸" },
  // Go
  { value: "gin", label: "Gin", icon: "🍸" },
  { value: "fiber", label: "Fiber", icon: "⚡" },
  { value: "echo", label: "Echo", icon: "📣" },
  { value: "chi", label: "Chi", icon: "🐹" },
  // Rust
  { value: "actix", label: "Actix", icon: "🦀" },
  { value: "axum", label: "Axum", icon: "🦀" },
  { value: "rocket", label: "Rocket", icon: "🚀" },
  { value: "warp", label: "Warp", icon: "🦀" },
  // PHP
  { value: "laravel", label: "Laravel", icon: "🐘" },
  { value: "symfony", label: "Symfony", icon: "🎵" },
  { value: "wordpress", label: "WordPress", icon: "📝" },
  // Mobile
  { value: "flutter", label: "Flutter", icon: "🦋" },
  { value: "reactnative", label: "React Native", icon: "📱" },
  { value: "swiftui", label: "SwiftUI", icon: "🍎" },
  { value: "jetpackcompose", label: "Jetpack Compose", icon: "🤖" },
  { value: "ionic", label: "Ionic", icon: "⚡" },
  { value: "expo", label: "Expo", icon: "📱" },
  // Desktop
  { value: "electron", label: "Electron", icon: "⚡" },
  { value: "tauri", label: "Tauri", icon: "🦀" },
  // CSS/UI
  { value: "tailwind", label: "Tailwind CSS", icon: "🎨" },
  { value: "bootstrap", label: "Bootstrap", icon: "🅱️" },
  { value: "chakra", label: "Chakra UI", icon: "⚡" },
  { value: "mui", label: "Material UI", icon: "🎨" },
  { value: "antdesign", label: "Ant Design", icon: "🐜" },
  { value: "shadcn", label: "shadcn/ui", icon: "🎨" },
  // State/Data
  { value: "redux", label: "Redux", icon: "🔄" },
  { value: "zustand", label: "Zustand", icon: "🐻" },
  { value: "tanstack", label: "TanStack Query", icon: "🔮" },
  { value: "trpc", label: "tRPC", icon: "🔗" },
  { value: "graphql", label: "GraphQL", icon: "◼️" },
  // Databases/ORMs
  { value: "prisma", label: "Prisma", icon: "🔺" },
  { value: "drizzle", label: "Drizzle", icon: "💧" },
  { value: "typeorm", label: "TypeORM", icon: "📦" },
  { value: "sequelize", label: "Sequelize", icon: "📦" },
  { value: "mongoose", label: "Mongoose", icon: "🍃" },
  { value: "sqlalchemy", label: "SQLAlchemy", icon: "🐍" },
  // Testing
  { value: "jest", label: "Jest", icon: "🃏" },
  { value: "vitest", label: "Vitest", icon: "⚡" },
  { value: "playwright", label: "Playwright", icon: "🎭" },
  { value: "cypress", label: "Cypress", icon: "🌲" },
  { value: "pytest", label: "pytest", icon: "🐍" },
  // DevOps/Infra - Containers
  { value: "docker", label: "Docker", icon: "🐳" },
  { value: "podman", label: "Podman", icon: "🦭" },
  { value: "containerd", label: "containerd", icon: "📦" },
  { value: "buildah", label: "Buildah", icon: "🔨" },
  // Kubernetes & Orchestration
  { value: "kubernetes", label: "Kubernetes", icon: "☸️" },
  { value: "helm", label: "Helm", icon: "⎈" },
  { value: "kustomize", label: "Kustomize", icon: "📋" },
  { value: "kubebuilder", label: "Kubebuilder", icon: "🔧" },
  { value: "operatorsdk", label: "Operator SDK", icon: "⚙️" },
  { value: "crossplane", label: "Crossplane", icon: "🔀" },
  { value: "k3s", label: "K3s", icon: "☸️" },
  { value: "kind", label: "Kind", icon: "📦" },
  { value: "minikube", label: "Minikube", icon: "💻" },
  { value: "rancher", label: "Rancher", icon: "🐄" },
  { value: "openshift", label: "OpenShift", icon: "🎩" },
  // IaC - Infrastructure as Code
  { value: "terraform", label: "Terraform", icon: "🏗️" },
  { value: "terragrunt", label: "Terragrunt", icon: "🏗️" },
  { value: "opentofu", label: "OpenTofu", icon: "🏗️" },
  { value: "pulumi", label: "Pulumi", icon: "☁️" },
  { value: "cdktf", label: "CDK for Terraform", icon: "🏗️" },
  { value: "awscdk", label: "AWS CDK", icon: "☁️" },
  { value: "cloudformation", label: "CloudFormation", icon: "☁️" },
  { value: "bicep", label: "Bicep (Azure)", icon: "💪" },
  { value: "arm", label: "ARM Templates", icon: "☁️" },
  { value: "gcp_dm", label: "GCP Deployment Manager", icon: "☁️" },
  // Configuration Management
  { value: "ansible", label: "Ansible", icon: "🔧" },
  { value: "chef", label: "Chef", icon: "👨‍🍳" },
  { value: "puppet", label: "Puppet", icon: "🎭" },
  { value: "saltstack", label: "SaltStack", icon: "🧂" },
  // GitOps
  { value: "argocd", label: "ArgoCD", icon: "🐙" },
  { value: "fluxcd", label: "FluxCD", icon: "🔄" },
  { value: "jenkinsx", label: "Jenkins X", icon: "🔧" },
  // Service Mesh & Networking
  { value: "istio", label: "Istio", icon: "🕸️" },
  { value: "linkerd", label: "Linkerd", icon: "🔗" },
  { value: "consul", label: "Consul", icon: "🔍" },
  { value: "envoy", label: "Envoy", icon: "📬" },
  { value: "nginx", label: "NGINX", icon: "🌐" },
  { value: "traefik", label: "Traefik", icon: "🚦" },
  { value: "caddy", label: "Caddy", icon: "🔒" },
  { value: "haproxy", label: "HAProxy", icon: "⚖️" },
  // Observability & Monitoring
  { value: "prometheus", label: "Prometheus", icon: "📊" },
  { value: "grafana", label: "Grafana", icon: "📈" },
  { value: "datadog", label: "Datadog", icon: "🐕" },
  { value: "newrelic", label: "New Relic", icon: "📊" },
  { value: "opentelemetry", label: "OpenTelemetry", icon: "🔭" },
  { value: "jaeger", label: "Jaeger", icon: "🔍" },
  { value: "zipkin", label: "Zipkin", icon: "🔍" },
  { value: "elk", label: "ELK Stack", icon: "📋" },
  { value: "loki", label: "Loki", icon: "📝" },
  { value: "fluentd", label: "Fluentd", icon: "📤" },
  { value: "fluentbit", label: "Fluent Bit", icon: "📤" },
  { value: "vector", label: "Vector", icon: "➡️" },
  // Secrets & Security
  { value: "vault", label: "HashiCorp Vault", icon: "🔐" },
  { value: "sops", label: "SOPS", icon: "🔒" },
  { value: "externalsecrets", label: "External Secrets", icon: "🔑" },
  { value: "sealedsecrets", label: "Sealed Secrets", icon: "📦" },
  { value: "trivy", label: "Trivy", icon: "🛡️" },
  { value: "snyk", label: "Snyk", icon: "🔍" },
  { value: "falco", label: "Falco", icon: "🦅" },
  { value: "opa", label: "Open Policy Agent", icon: "🛡️" },
  { value: "kyverno", label: "Kyverno", icon: "🛡️" },
  // CI/CD Tools
  { value: "jenkins", label: "Jenkins", icon: "🔧" },
  { value: "tekton", label: "Tekton", icon: "🔧" },
  { value: "drone", label: "Drone CI", icon: "🐝" },
  { value: "concourse", label: "Concourse", icon: "✈️" },
  { value: "spinnaker", label: "Spinnaker", icon: "🎡" },
  // Databases - DevOps perspective
  { value: "postgresql", label: "PostgreSQL", icon: "🐘" },
  { value: "mysql", label: "MySQL", icon: "🐬" },
  { value: "mongodb", label: "MongoDB", icon: "🍃" },
  { value: "redis", label: "Redis", icon: "🔴" },
  { value: "elasticsearch", label: "Elasticsearch", icon: "🔍" },
  { value: "cassandra", label: "Cassandra", icon: "👁️" },
  { value: "cockroachdb", label: "CockroachDB", icon: "🪳" },
  { value: "clickhouse", label: "ClickHouse", icon: "🏠" },
  { value: "timescaledb", label: "TimescaleDB", icon: "⏱️" },
  { value: "influxdb", label: "InfluxDB", icon: "📈" },
  // Message Queues
  { value: "kafka", label: "Apache Kafka", icon: "📨" },
  { value: "rabbitmq", label: "RabbitMQ", icon: "🐰" },
  { value: "nats", label: "NATS", icon: "📬" },
  { value: "pulsar", label: "Apache Pulsar", icon: "⭐" },
  { value: "sqs", label: "AWS SQS", icon: "📬" },
  // ML/AI Ops
  { value: "mlflow", label: "MLflow", icon: "🧪" },
  { value: "kubeflow", label: "Kubeflow", icon: "☸️" },
  { value: "airflow", label: "Apache Airflow", icon: "🌬️" },
  { value: "dagster", label: "Dagster", icon: "📊" },
  { value: "prefect", label: "Prefect", icon: "🔄" },
  { value: "ray", label: "Ray", icon: "☀️" },
  // Serverless
  { value: "serverless", label: "Serverless Framework", icon: "⚡" },
  { value: "sam", label: "AWS SAM", icon: "☁️" },
  { value: "openfaas", label: "OpenFaaS", icon: "λ" },
  { value: "knative", label: "Knative", icon: "☸️" },
];

// Databases - organized by category for better UX
const DATABASES = [
  // === OPEN SOURCE RELATIONAL ===
  { value: "postgresql", label: "PostgreSQL", icon: "🐘", category: "opensource" },
  { value: "mysql", label: "MySQL", icon: "🐬", category: "opensource" },
  { value: "mariadb", label: "MariaDB", icon: "🦭", category: "opensource" },
  { value: "sqlite", label: "SQLite", icon: "📦", category: "opensource" },
  { value: "cockroachdb", label: "CockroachDB", icon: "🪳", category: "opensource" },
  { value: "yugabytedb", label: "YugabyteDB", icon: "🔵", category: "opensource" },
  { value: "tidb", label: "TiDB", icon: "⚡", category: "opensource" },
  { value: "vitess", label: "Vitess", icon: "🟢", category: "opensource" },
  // === OPEN SOURCE NOSQL - Document ===
  { value: "mongodb", label: "MongoDB", icon: "🍃", category: "opensource" },
  { value: "couchdb", label: "CouchDB", icon: "🛋️", category: "opensource" },
  { value: "arangodb", label: "ArangoDB", icon: "🥑", category: "opensource" },
  { value: "ferretdb", label: "FerretDB", icon: "🐻", category: "opensource" },
  { value: "pouchdb", label: "PouchDB", icon: "📱", category: "opensource" },
  // === OPEN SOURCE NOSQL - Key-Value ===
  { value: "redis", label: "Redis", icon: "🔴", category: "opensource" },
  { value: "valkey", label: "Valkey", icon: "🔑", category: "opensource" },
  { value: "keydb", label: "KeyDB", icon: "🗝️", category: "opensource" },
  { value: "dragonfly", label: "Dragonfly", icon: "🐉", category: "opensource" },
  { value: "memcached", label: "Memcached", icon: "💾", category: "opensource" },
  { value: "etcd", label: "etcd", icon: "🔧", category: "opensource" },
  // === OPEN SOURCE NOSQL - Wide Column ===
  { value: "cassandra", label: "Apache Cassandra", icon: "👁️", category: "opensource" },
  { value: "scylladb", label: "ScyllaDB", icon: "🦂", category: "opensource" },
  { value: "hbase", label: "Apache HBase", icon: "🐘", category: "opensource" },
  // === OPEN SOURCE NOSQL - Graph ===
  { value: "neo4j", label: "Neo4j", icon: "🔗", category: "opensource" },
  { value: "dgraph", label: "Dgraph", icon: "📊", category: "opensource" },
  { value: "janusgraph", label: "JanusGraph", icon: "🪐", category: "opensource" },
  { value: "agensgraph", label: "AgensGraph", icon: "🌐", category: "opensource" },
  // === OPEN SOURCE - Time Series ===
  { value: "timescaledb", label: "TimescaleDB", icon: "⏱️", category: "opensource" },
  { value: "influxdb", label: "InfluxDB", icon: "📈", category: "opensource" },
  { value: "questdb", label: "QuestDB", icon: "🏎️", category: "opensource" },
  { value: "victoriametrics", label: "VictoriaMetrics", icon: "📊", category: "opensource" },
  { value: "prometheus", label: "Prometheus", icon: "🔥", category: "opensource" },
  // === OPEN SOURCE - Analytics/OLAP ===
  { value: "clickhouse", label: "ClickHouse", icon: "🏠", category: "opensource" },
  { value: "apache_druid", label: "Apache Druid", icon: "🧙", category: "opensource" },
  { value: "apache_pinot", label: "Apache Pinot", icon: "🎯", category: "opensource" },
  { value: "duckdb", label: "DuckDB", icon: "🦆", category: "opensource" },
  { value: "starrocks", label: "StarRocks", icon: "⭐", category: "opensource" },
  // === OPEN SOURCE - Search ===
  { value: "elasticsearch", label: "Elasticsearch", icon: "🔍", category: "opensource" },
  { value: "opensearch", label: "OpenSearch", icon: "🔎", category: "opensource" },
  { value: "meilisearch", label: "Meilisearch", icon: "⚡", category: "opensource" },
  { value: "typesense", label: "Typesense", icon: "🔤", category: "opensource" },
  { value: "solr", label: "Apache Solr", icon: "☀️", category: "opensource" },
  { value: "zinc", label: "Zinc", icon: "🔬", category: "opensource" },
  // === OPEN SOURCE - Vector/AI ===
  { value: "milvus", label: "Milvus", icon: "🧠", category: "opensource" },
  { value: "weaviate", label: "Weaviate", icon: "🕸️", category: "opensource" },
  { value: "qdrant", label: "Qdrant", icon: "🎯", category: "opensource" },
  { value: "chroma", label: "Chroma", icon: "🎨", category: "opensource" },
  { value: "pgvector", label: "pgvector", icon: "🐘", category: "opensource" },
  // === OPEN SOURCE - Message Queues (often used as DBs) ===
  { value: "kafka", label: "Apache Kafka", icon: "📨", category: "opensource" },
  { value: "rabbitmq", label: "RabbitMQ", icon: "🐰", category: "opensource" },
  { value: "nats", label: "NATS", icon: "📬", category: "opensource" },
  { value: "pulsar", label: "Apache Pulsar", icon: "💫", category: "opensource" },
  { value: "redpanda", label: "Redpanda", icon: "🐼", category: "opensource" },
  // === OPEN SOURCE - Embedded/Edge ===
  { value: "leveldb", label: "LevelDB", icon: "📚", category: "opensource" },
  { value: "rocksdb", label: "RocksDB", icon: "🪨", category: "opensource" },
  { value: "badger", label: "Badger", icon: "🦡", category: "opensource" },
  { value: "surrealdb", label: "SurrealDB", icon: "🌊", category: "opensource" },
  { value: "rqlite", label: "rqlite", icon: "📡", category: "opensource" },
  // === CLOUD MANAGED - AWS ===
  { value: "aws_rds", label: "AWS RDS", icon: "☁️", category: "cloud" },
  { value: "aws_aurora", label: "AWS Aurora", icon: "🌅", category: "cloud" },
  { value: "aws_dynamodb", label: "AWS DynamoDB", icon: "⚡", category: "cloud" },
  { value: "aws_redshift", label: "AWS Redshift", icon: "📊", category: "cloud" },
  { value: "aws_neptune", label: "AWS Neptune", icon: "🔱", category: "cloud" },
  { value: "aws_timestream", label: "AWS Timestream", icon: "⏰", category: "cloud" },
  { value: "aws_documentdb", label: "AWS DocumentDB", icon: "📄", category: "cloud" },
  { value: "aws_elasticache", label: "AWS ElastiCache", icon: "💨", category: "cloud" },
  { value: "aws_memorydb", label: "AWS MemoryDB", icon: "🧠", category: "cloud" },
  // === CLOUD MANAGED - GCP ===
  { value: "gcp_cloudsql", label: "GCP Cloud SQL", icon: "☁️", category: "cloud" },
  { value: "gcp_spanner", label: "GCP Spanner", icon: "🔧", category: "cloud" },
  { value: "gcp_firestore", label: "GCP Firestore", icon: "🔥", category: "cloud" },
  { value: "gcp_bigtable", label: "GCP Bigtable", icon: "📊", category: "cloud" },
  { value: "gcp_bigquery", label: "GCP BigQuery", icon: "🔍", category: "cloud" },
  { value: "gcp_memorystore", label: "GCP Memorystore", icon: "💾", category: "cloud" },
  { value: "gcp_alloydb", label: "GCP AlloyDB", icon: "🔷", category: "cloud" },
  // === CLOUD MANAGED - Azure ===
  { value: "azure_sql", label: "Azure SQL", icon: "☁️", category: "cloud" },
  { value: "azure_cosmosdb", label: "Azure Cosmos DB", icon: "🌌", category: "cloud" },
  { value: "azure_synapse", label: "Azure Synapse", icon: "🔗", category: "cloud" },
  { value: "azure_cache", label: "Azure Cache for Redis", icon: "💨", category: "cloud" },
  { value: "azure_postgresql", label: "Azure PostgreSQL", icon: "🐘", category: "cloud" },
  { value: "azure_mysql", label: "Azure MySQL", icon: "🐬", category: "cloud" },
  // === CLOUD MANAGED - Other ===
  { value: "planetscale", label: "PlanetScale", icon: "🪐", category: "cloud" },
  { value: "neon", label: "Neon", icon: "💡", category: "cloud" },
  { value: "supabase", label: "Supabase", icon: "⚡", category: "cloud" },
  { value: "turso", label: "Turso", icon: "🚀", category: "cloud" },
  { value: "xata", label: "Xata", icon: "✨", category: "cloud" },
  { value: "upstash", label: "Upstash", icon: "🔺", category: "cloud" },
  { value: "railway_postgres", label: "Railway Postgres", icon: "🚂", category: "cloud" },
  { value: "render_postgres", label: "Render Postgres", icon: "🔷", category: "cloud" },
  { value: "digitalocean_dbaas", label: "DigitalOcean DBaaS", icon: "🌊", category: "cloud" },
  { value: "aiven", label: "Aiven", icon: "🔴", category: "cloud" },
  { value: "mongodb_atlas", label: "MongoDB Atlas", icon: "🍃", category: "cloud" },
  { value: "elastic_cloud", label: "Elastic Cloud", icon: "🔍", category: "cloud" },
  { value: "redis_cloud", label: "Redis Cloud", icon: "🔴", category: "cloud" },
  { value: "fauna", label: "Fauna", icon: "🦎", category: "cloud" },
  { value: "pinecone", label: "Pinecone", icon: "🌲", category: "cloud" },
  { value: "snowflake", label: "Snowflake", icon: "❄️", category: "cloud" },
  { value: "databricks", label: "Databricks", icon: "🧱", category: "cloud" },
  { value: "cockroach_cloud", label: "CockroachDB Cloud", icon: "🪳", category: "cloud" },
  { value: "timescale_cloud", label: "Timescale Cloud", icon: "⏱️", category: "cloud" },
  { value: "clickhouse_cloud", label: "ClickHouse Cloud", icon: "🏠", category: "cloud" },
  // === CLOSED SOURCE / PROPRIETARY ===
  { value: "oracle", label: "Oracle Database", icon: "🔶", category: "proprietary" },
  { value: "mssql", label: "Microsoft SQL Server", icon: "🟦", category: "proprietary" },
  { value: "db2", label: "IBM Db2", icon: "🔷", category: "proprietary" },
  { value: "teradata", label: "Teradata", icon: "🟠", category: "proprietary" },
  { value: "sap_hana", label: "SAP HANA", icon: "🔵", category: "proprietary" },
  { value: "informix", label: "IBM Informix", icon: "📊", category: "proprietary" },
  { value: "sybase", label: "SAP ASE (Sybase)", icon: "🔷", category: "proprietary" },
  { value: "singlestore", label: "SingleStore", icon: "⚡", category: "proprietary" },
  { value: "marklogic", label: "MarkLogic", icon: "📁", category: "proprietary" },
  { value: "intersystems_cache", label: "InterSystems Caché", icon: "💎", category: "proprietary" },
];

const AI_BEHAVIOR_RULES = [
  { id: "always_debug_after_build", label: "Always Debug After Building", description: "Run and test locally after making changes", recommended: true },
  { id: "check_logs_after_build", label: "Check Logs After Build/Commit", description: "Check logs when build or commit finishes", recommended: true },
  { id: "run_tests_before_commit", label: "Run Tests Before Commit", description: "Ensure tests pass before committing", recommended: true },
  { id: "follow_existing_patterns", label: "Follow Existing Patterns", description: "Match the codebase's existing style", recommended: true },
  { id: "ask_before_large_refactors", label: "Ask Before Large Refactors", description: "Confirm before significant changes", recommended: true },
  { id: "check_for_security_issues", label: "Check for Security Issues", description: "Review for common vulnerabilities", recommended: false },
];

// Project types define AI behavior flexibility
const PROJECT_TYPES = [
  {
    id: "work",
    label: "Work / Professional",
    icon: "💼",
    description: "Follow procedures strictly, don't deviate from established patterns",
    aiNote: "Strict adherence to documented procedures. Don't make assumptions or go your own way.",
  },
  {
    id: "open_source",
    label: "Open Source",
    icon: "🌱",
    description: "Open source project, community contributions welcome",
    aiNote: "Follow existing conventions strictly. Document everything. Consider backward compatibility. Be thorough but pragmatic.",
  },
  {
    id: "leisure",
    label: "Leisure / Learning",
    icon: "🎮",
    description: "For fun, experimentation, or learning new things",
    aiNote: "Be inventive and creative. Never delete files without explicit consent. Explain concepts as you go.",
  },
  {
    id: "private_business",
    label: "Private Business",
    icon: "🏠",
    description: "Side project or startup with commercial goals",
    aiNote: "Balance speed with quality. Focus on MVP features. Document important decisions.",
  },
];

// Architecture patterns for project structure
const ARCHITECTURE_PATTERNS = [
  { id: "monolith", label: "Monolith" },
  { id: "modular_monolith", label: "Modular Monolith" },
  { id: "microservices", label: "Microservices" },
  { id: "serverless", label: "Serverless" },
  { id: "event_driven", label: "Event-Driven" },
  { id: "layered", label: "Layered / N-Tier" },
  { id: "hexagonal", label: "Hexagonal / Ports & Adapters" },
  { id: "clean", label: "Clean Architecture" },
  { id: "cqrs", label: "CQRS" },
  { id: "mvc", label: "MVC / MVVM" },
  { id: "other", label: "Other" },
];

// Important files AI should read first (NOT AI config files - those are what we're creating)
const IMPORTANT_FILES = [
  { id: "readme", label: "README.md", icon: "📖" },
  { id: "package_json", label: "package.json", icon: "📦" },
  { id: "changelog", label: "CHANGELOG.md", icon: "📝" },
  { id: "contributing", label: "CONTRIBUTING.md", icon: "🤝" },
  { id: "makefile", label: "Makefile", icon: "🔧" },
  { id: "dockerfile", label: "Dockerfile", icon: "🐳" },
  { id: "docker_compose", label: "docker-compose.yml", icon: "🐳" },
  { id: "env_example", label: ".env.example", icon: "🔐" },
  { id: "openapi", label: "openapi.yaml / swagger.json", icon: "📡" },
  { id: "architecture_md", label: "ARCHITECTURE.md", icon: "🏗️" },
  { id: "api_docs", label: "API documentation", icon: "📚" },
  { id: "database_schema", label: "Database schema / migrations", icon: "🗄️" },
];

// Error handling patterns
const ERROR_HANDLING_PATTERNS = [
  { id: "try_catch", label: "Try-Catch Everywhere" },
  { id: "result_types", label: "Result / Either Types" },
  { id: "error_boundaries", label: "Error Boundaries (React)" },
  { id: "global_handler", label: "Global Error Handler" },
  { id: "middleware", label: "Middleware-based" },
  { id: "exceptions", label: "Custom Exceptions / Errors" },
  { id: "other", label: "Other" },
];

// Platforms are the PRIMARY target, but files often work across multiple IDEs
const PLATFORMS = [
  {
    id: "universal",
    name: "Universal",
    file: "AGENTS.md",
    icon: "🌐",
    gradient: "from-violet-500 to-purple-500",
    note: "Works with all AI-enabled IDEs",
  },
  {
    id: "cursor",
    name: "Cursor",
    file: ".cursor/rules",
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    note: "Native project rules format",
  },
  {
    id: "claude",
    name: "Claude Code",
    file: "CLAUDE.md",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Also works with Cursor",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
    icon: "🐙",
    gradient: "from-gray-600 to-gray-800",
    note: "VS Code & JetBrains",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    file: ".windsurfrules",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Codeium IDE",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    file: "GEMINI.md",
    icon: "💎",
    gradient: "from-blue-600 to-indigo-600",
    note: "Google's AI-powered IDE",
  },
  {
    id: "aider",
    name: "Aider",
    file: ".aider.conf.yml",
    icon: "🤖",
    gradient: "from-green-500 to-lime-500",
    note: "CLI AI pair programming",
  },
  {
    id: "continue",
    name: "Continue",
    file: ".continue/config.json",
    icon: "➡️",
    gradient: "from-blue-600 to-indigo-500",
    note: "Open-source autopilot",
  },
  {
    id: "cody",
    name: "Sourcegraph Cody",
    file: ".cody/config.json",
    icon: "🔍",
    gradient: "from-pink-500 to-rose-500",
    note: "Context-aware AI",
  },
  {
    id: "tabnine",
    name: "Tabnine",
    file: ".tabnine.yaml",
    icon: "📝",
    gradient: "from-cyan-500 to-blue-500",
    note: "AI code completion",
  },
  {
    id: "supermaven",
    name: "Supermaven",
    file: ".supermaven/config.json",
    icon: "🦸",
    gradient: "from-amber-500 to-orange-500",
    note: "Fast AI completions",
  },
  {
    id: "codegpt",
    name: "CodeGPT",
    file: ".codegpt/config.json",
    icon: "💬",
    gradient: "from-emerald-500 to-teal-500",
    note: "VS Code AI assistant",
  },
  {
    id: "void",
    name: "Void",
    file: ".void/config.json",
    icon: "🕳️",
    gradient: "from-slate-600 to-slate-800",
    note: "Open-source Cursor alt",
  },
];

type CommandsConfig = {
  build: string;
  test: string;
  lint: string;
  dev: string;
  additional: string[];
  savePreferences: boolean;
};

type BoundariesConfig = {
  always: string[];
  ask: string[];
  never: string[];
  savePreferences: boolean;
};

type CodeStyleConfig = {
  naming: string;
  errorHandling: string;
  errorHandlingOther: string;
  loggingConventions: string;
  loggingConventionsOther: string;
  notes: string;
  savePreferences: boolean;
};

type TestingStrategyConfig = {
  levels: string[];
  coverage: number;
  frameworks: string[];
  notes: string;
  savePreferences: boolean;
};

type StaticFilesConfig = {
  funding: boolean;
  fundingYml: string;
  fundingSave: boolean;
  editorconfig: boolean;
  editorconfigCustom: string;
  editorconfigSave: boolean;
  contributing: boolean;
  contributingCustom: string;
  contributingSave: boolean;
  codeOfConduct: boolean;
  codeOfConductCustom: string;
  codeOfConductSave: boolean;
  security: boolean;
  securityCustom: string;
  securitySave: boolean;
  roadmap: boolean;
  roadmapCustom: string;
  roadmapSave: boolean;
  gitignoreMode: "generate" | "custom" | "skip";
  gitignoreCustom: string;
  gitignoreSave: boolean;
  dockerignoreMode: "generate" | "custom" | "skip";
  dockerignoreCustom: string;
  dockerignoreSave: boolean;
  licenseSave: boolean;
};

type WizardConfig = {
  projectName: string;
  projectDescription: string;
  projectType: string;
  architecturePattern: string;
  architecturePatternOther: string;
  devOS: string; // windows, macos, linux
  languages: string[];
  frameworks: string[];
  databases: string[]; // preferred databases (multi-select)
  letAiDecide: boolean;
  repoHost: string;
  repoHostOther: string;
  repoUrl: string;
  exampleRepoUrl: string;
  documentationUrl: string; // external docs (Confluence, Notion, etc.)
  isPublic: boolean;
  license: string;
  licenseOther: string;
  licenseNotes: string;
  licenseSave: boolean;
  repoHosts: string[];
  multiRepoReason: string;
  funding: boolean;
  fundingYml: string;
  conventionalCommits: boolean;
  semver: boolean;
  dependabot: boolean;
  cicd: string;
  deploymentTargets: string[];
  buildContainer: boolean;
  containerRegistry: string;
  containerRegistryOther: string;
  registryUsername: string;
  aiBehaviorRules: string[];
  importantFiles: string[];
  importantFilesOther: string;
  enableAutoUpdate: boolean;
  includePersonalData: boolean;
  platform: string;
  blueprintMode: boolean; // Generate with [[VARIABLE|default]] for blueprint templates
  enableApiSync: boolean; // Auto-save as private template with API sync instructions
  additionalFeedback: string;
  commands: CommandsConfig;
  codeStyle: CodeStyleConfig;
  boundaries: BoundariesConfig;
  testing: TestingStrategyConfig;
  staticFiles: StaticFilesConfig;
};

interface WizardDraftSummary {
  id: string;
  name: string;
  step: number;
  createdAt: string;
  updatedAt: string;
  projectName: string;
  projectType: string;
  languages: string[];
  frameworks: string[];
  platform: string;
}

function WizardPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<GeneratedFile[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [tierLoading, setTierLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [existingBlueprintId, setExistingBlueprintId] = useState<string | null>(null);
  const [isSavingBlueprint, setIsSavingBlueprint] = useState(false);
  const [savedBlueprintId, setSavedBlueprintId] = useState<string | null>(null);
  
  // Draft state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showLoadDraftModal, setShowLoadDraftModal] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<WizardDraftSummary[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showSaveBlueprintModal, setShowSaveBlueprintModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "share" | null>(null);
  
  // Repo detection state (Max/Teams feature)
  const [repoDetectUrl, setRepoDetectUrl] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<{
    name: string | null;
    description: string | null;
    stack: string[];
    commands: { build?: string; test?: string; lint?: string; dev?: string };
    license: string | null;
    repoHost: string;
    cicd: string | null;
    hasDocker: boolean;
    containerRegistry: string | null;
    testFramework: string | null;
    existingFiles: string[];
    isOpenSource: boolean;
    projectType: string | null;
  } | null>(null);

  const [config, setConfig] = useState<WizardConfig>({
    projectName: "",
    projectDescription: "",
    projectType: "leisure",
    architecturePattern: "",
    architecturePatternOther: "",
    devOS: "linux",
    languages: [],
    frameworks: [],
    databases: [],
    letAiDecide: false,
    repoHost: "github",
    repoHostOther: "",
    repoUrl: "",
    exampleRepoUrl: "",
    documentationUrl: "",
    isPublic: true,
    license: "none",
    licenseOther: "",
    licenseNotes: "",
    licenseSave: false,
    repoHosts: [],
    multiRepoReason: "",
    funding: false,
    fundingYml: "",
    conventionalCommits: true,
    semver: true,
    dependabot: true,
    cicd: "github_actions",
    deploymentTargets: [],
    buildContainer: false,
    containerRegistry: "",
    containerRegistryOther: "",
    registryUsername: "",
    aiBehaviorRules: ["always_debug_after_build", "check_logs_after_build", "run_tests_before_commit", "follow_existing_patterns", "ask_before_large_refactors", "check_for_security_issues"],
    importantFiles: [],
    importantFilesOther: "",
    enableAutoUpdate: false,
    includePersonalData: true,
    platform: "universal",
    blueprintMode: false,
    enableApiSync: false,
    additionalFeedback: "",
    commands: { build: "", test: "", lint: "", dev: "", additional: [], savePreferences: false },
    codeStyle: { naming: "language_default", errorHandling: "", errorHandlingOther: "", loggingConventions: "", loggingConventionsOther: "", notes: "", savePreferences: false },
    boundaries: { always: [], ask: [], never: [], savePreferences: false },
    testing: { levels: [], coverage: 80, frameworks: [], notes: "", savePreferences: false },
    staticFiles: {
      funding: false,
      fundingYml: "",
      fundingSave: false,
      editorconfig: false,
      editorconfigCustom: "",
      editorconfigSave: false,
      contributing: false,
      contributingCustom: "",
      contributingSave: false,
      codeOfConduct: false,
      codeOfConductCustom: "",
      codeOfConductSave: false,
      security: false,
      securityCustom: "",
      securitySave: false,
      roadmap: true,
      roadmapCustom: "",
      roadmapSave: false,
      gitignoreMode: "skip",
      gitignoreCustom: "",
      gitignoreSave: false,
      dockerignoreMode: "skip",
      dockerignoreCustom: "",
      dockerignoreSave: false,
      licenseSave: false,
    },
  });

  // Fetch user's drafts
  const fetchDrafts = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/wizard/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  }, [status]);

  // Load draft from URL param on mount
  useEffect(() => {
    const loadDraftFromParam = async () => {
      const draftId = searchParams.get("draft");
      if (!draftId || status !== "authenticated" || draftLoaded) return;
      
      setIsLoadingDraft(true);
      try {
        const res = await fetch(`/api/wizard/drafts/${draftId}`);
        if (res.ok) {
          const draft = await res.json();
          setConfig(draft.config as WizardConfig);
          setCurrentStep(draft.step);
          setCurrentDraftId(draft.id);
          setDraftName(draft.name);
          setDraftLoaded(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      } finally {
        setIsLoadingDraft(false);
      }
    };
    
    loadDraftFromParam();
  }, [searchParams, status, draftLoaded]);

  // Fetch drafts when modal opens
  useEffect(() => {
    if (showLoadDraftModal) {
      fetchDrafts();
    }
  }, [showLoadDraftModal, fetchDrafts]);

  // Save draft function
  const handleSaveDraft = async () => {
    if (!draftName.trim()) return;
    
    setIsSavingDraft(true);
    try {
      const res = await fetch("/api/wizard/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDraftId,
          name: draftName.trim(),
          step: currentStep,
          config,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentDraftId(data.id);
        setShowDraftModal(false);
        // Optionally show success message
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load draft function
  const handleLoadDraft = async (draftId: string) => {
    setIsLoadingDraft(true);
    try {
      const res = await fetch(`/api/wizard/drafts/${draftId}`);
      if (res.ok) {
        const draft = await res.json();
        setConfig(draft.config as WizardConfig);
        setCurrentStep(draft.step);
        setCurrentDraftId(draft.id);
        setDraftName(draft.name);
        setShowLoadDraftModal(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Failed to load draft");
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
      alert("Failed to load draft. Please try again.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  // Delete draft function
  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    setIsDeletingDraft(draftId);
    try {
      const res = await fetch(`/api/wizard/drafts/${draftId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
          setDraftName("");
        }
      } else {
        alert("Failed to delete draft");
      }
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Failed to delete draft. Please try again.");
    } finally {
      setIsDeletingDraft(null);
    }
  };

  // Detect repository configuration (Max/Teams only)
  const handleDetectRepo = async () => {
    if (!repoDetectUrl.trim()) {
      setDetectError("Please enter a repository URL");
      return;
    }

    setIsDetecting(true);
    setDetectError(null);
    setDetectedData(null);

    try {
      const res = await fetch("/api/wizard/detect-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoDetectUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDetectError(data.error || "Failed to detect repository");
        return;
      }

      if (data.detected) {
        setDetectedData(data.detected);
      }
    } catch (error) {
      console.error("Repo detection error:", error);
      setDetectError("Failed to connect. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  // Apply detected data to config
  const applyDetectedData = () => {
    if (!detectedData) return;

    setConfig(prev => ({
      ...prev,
      projectName: detectedData.name || prev.projectName,
      projectDescription: detectedData.description || prev.projectDescription,
      projectType: detectedData.projectType || prev.projectType,
      languages: detectedData.stack.filter(s => 
        ["javascript", "typescript", "python", "go", "rust", "java", "csharp", "ruby", "php", "swift", "kotlin", "cpp"].includes(s)
      ),
      frameworks: detectedData.stack.filter(s => 
        ["nextjs", "react", "vue", "angular", "svelte", "express", "fastapi", "django", "flask", "rails", "laravel", "nestjs", "prisma", "drizzle", "tailwind", "vite", "vitest", "jest", "playwright", "cypress"].includes(s)
      ),
      repoHost: detectedData.repoHost || prev.repoHost,
      repoHosts: detectedData.repoHost ? [detectedData.repoHost] : prev.repoHosts,
      license: detectedData.license || prev.license,
      cicd: detectedData.cicd || prev.cicd,
      buildContainer: detectedData.hasDocker,
      containerRegistry: detectedData.containerRegistry || prev.containerRegistry,
      isPublic: detectedData.isOpenSource,
      commands: {
        ...prev.commands,
        build: detectedData.commands.build || prev.commands.build,
        test: detectedData.commands.test || prev.commands.test,
        lint: detectedData.commands.lint || prev.commands.lint,
        dev: detectedData.commands.dev || prev.commands.dev,
      },
      testing: {
        ...prev.testing,
        frameworks: detectedData.testFramework ? [detectedData.testFramework] : prev.testing.frameworks,
      },
      // Apply detected existing static files
      staticFiles: {
        ...prev.staticFiles,
        contributing: detectedData.existingFiles.includes("CONTRIBUTING.md"),
        codeOfConduct: detectedData.existingFiles.includes("CODE_OF_CONDUCT.md"),
        security: detectedData.existingFiles.includes("SECURITY.md"),
        roadmap: detectedData.existingFiles.includes("ROADMAP.md"),
        editorconfig: detectedData.existingFiles.includes(".editorconfig"),
      },
    }));

    // Clear detection state after applying
    setDetectedData(null);
    setRepoDetectUrl("");
  };

  useEffect(() => {
    const fetchTier = async () => {
      if (status !== "authenticated") {
        setTierLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json();
          setUserTier(data.plan || "free");
        }
      } catch {
        setUserTier("free");
      } finally {
        setTierLoading(false);
      }
    };
    fetchTier();
  }, [status]);

  // Prefill from preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (status !== "authenticated") {
        setPreferencesLoaded(true);
        return;
      }
      try {
        const res = await fetch("/api/user/wizard-preferences");
        if (!res.ok) throw new Error("pref fetch failed");
        const data = await res.json();

        // API returns an object grouped by category/key. Flatten it for easy use.
        const prefsArray: Array<{ category: string; key: string; value: any }> = [];
        if (Array.isArray(data)) {
          data.forEach((pref: any) => prefsArray.push(pref));
        } else if (data && typeof data === "object") {
          Object.entries(data).forEach(([category, entries]) => {
            if (entries && typeof entries === "object") {
              Object.entries(entries as Record<string, any>).forEach(([key, val]) => {
                prefsArray.push({
                  category,
                  key,
                  value: (val as any)?.value ?? (val as any),
                });
              });
            }
          });
        }

        const byCategory: Record<string, Record<string, any>> = {};
        prefsArray.forEach((pref: any) => {
          if (!byCategory[pref.category]) byCategory[pref.category] = {};
          byCategory[pref.category][pref.key] = pref.value;
        });
        setConfig((prev) => ({
          ...prev,
          commands: {
            ...prev.commands,
            build: byCategory.commands?.build ?? prev.commands.build,
            test: byCategory.commands?.test ?? prev.commands.test,
            lint: byCategory.commands?.lint ?? prev.commands.lint,
            dev: byCategory.commands?.dev ?? prev.commands.dev,
          },
          codeStyle: {
            ...prev.codeStyle,
            naming: byCategory.codeStyle?.naming ?? prev.codeStyle.naming,
            notes: byCategory.codeStyle?.notes ?? prev.codeStyle.notes,
          },
          testing: {
            ...prev.testing,
            levels: byCategory.testing?.levels 
              ? (typeof byCategory.testing.levels === 'string' 
                  ? byCategory.testing.levels.split(',').filter(Boolean) 
                  : byCategory.testing.levels)
              : prev.testing.levels,
            coverage: byCategory.testing?.coverage 
              ? (typeof byCategory.testing.coverage === 'string' 
                  ? parseInt(byCategory.testing.coverage, 10) 
                  : byCategory.testing.coverage)
              : prev.testing.coverage,
            frameworks: byCategory.testing?.frameworks 
              ? (typeof byCategory.testing.frameworks === 'string' 
                  ? byCategory.testing.frameworks.split(',').filter(Boolean) 
                  : byCategory.testing.frameworks)
              : prev.testing.frameworks,
            notes: byCategory.testing?.notes ?? prev.testing.notes,
          },
          staticFiles: {
            ...prev.staticFiles,
            // Support both new key "FUNDING.yml" and legacy "fundingYml"
            funding: (byCategory.static?.["FUNDING.yml"] || byCategory.static?.fundingYml) ? true : prev.staticFiles.funding,
            fundingYml: byCategory.static?.["FUNDING.yml"] ?? byCategory.static?.fundingYml ?? prev.staticFiles.fundingYml,
            fundingSave: (byCategory.static?.["FUNDING.yml"] || byCategory.static?.fundingYml) ? true : prev.staticFiles.fundingSave,
            editorconfig: byCategory.static?.editorconfig !== undefined
              ? (typeof byCategory.static.editorconfig === 'string' 
                  ? byCategory.static.editorconfig === 'true' 
                  : Boolean(byCategory.static.editorconfig))
              : prev.staticFiles.editorconfig,
            editorconfigCustom: byCategory.static?.editorconfigCustom ?? prev.staticFiles.editorconfigCustom,
            editorconfigSave: byCategory.static?.editorconfigCustom ? true : prev.staticFiles.editorconfigSave,
            contributing: byCategory.static?.contributing !== undefined
              ? (typeof byCategory.static.contributing === 'string' 
                  ? byCategory.static.contributing === 'true' 
                  : Boolean(byCategory.static.contributing))
              : prev.staticFiles.contributing,
            contributingCustom: byCategory.static?.contributingCustom ?? prev.staticFiles.contributingCustom,
            contributingSave: byCategory.static?.contributingCustom ? true : prev.staticFiles.contributingSave,
            codeOfConduct: byCategory.static?.codeOfConduct !== undefined
              ? (typeof byCategory.static.codeOfConduct === 'string' 
                  ? byCategory.static.codeOfConduct === 'true' 
                  : Boolean(byCategory.static.codeOfConduct))
              : prev.staticFiles.codeOfConduct,
            codeOfConductCustom: byCategory.static?.codeOfConductCustom ?? prev.staticFiles.codeOfConductCustom,
            codeOfConductSave: byCategory.static?.codeOfConductCustom ? true : prev.staticFiles.codeOfConductSave,
            security: byCategory.static?.security !== undefined
              ? (typeof byCategory.static.security === 'string' 
                  ? byCategory.static.security === 'true' 
                  : Boolean(byCategory.static.security))
              : prev.staticFiles.security,
            securityCustom: byCategory.static?.securityCustom ?? prev.staticFiles.securityCustom,
            securitySave: byCategory.static?.securityCustom ? true : prev.staticFiles.securitySave,
            gitignoreMode: byCategory.static?.gitignoreMode ?? prev.staticFiles.gitignoreMode,
            gitignoreCustom: byCategory.static?.gitignoreCustom ?? prev.staticFiles.gitignoreCustom,
            gitignoreSave: byCategory.static?.gitignoreCustom ? true : prev.staticFiles.gitignoreSave,
            dockerignoreMode: byCategory.static?.dockerignoreMode ?? prev.staticFiles.dockerignoreMode,
            dockerignoreCustom: byCategory.static?.dockerignoreCustom ?? prev.staticFiles.dockerignoreCustom,
            dockerignoreSave: byCategory.static?.dockerignoreCustom ? true : prev.staticFiles.dockerignoreSave,
            // licenseSave is now determined by whether license is in general
            licenseSave: byCategory.general?.license ? true : prev.staticFiles.licenseSave,
          },
          // Load license from general (new) or repo (legacy)
          license: byCategory.general?.license ?? byCategory.repo?.license ?? prev.license,
          repoHost: byCategory.repo?.host ?? prev.repoHost,
          isPublic: byCategory.repo?.isPublic !== undefined
            ? (typeof byCategory.repo.isPublic === 'string' 
                ? byCategory.repo.isPublic === 'true' 
                : Boolean(byCategory.repo.isPublic))
            : prev.isPublic,
        }));
      } catch {
        // ignore
      } finally {
        setPreferencesLoaded(true);
      }
    };
    loadPrefs();
  }, [status]);

  const lockedSteps = useMemo(
    () => WIZARD_STEPS.filter((s) => !canAccessTier(userTier, s.tier)),
    [userTier],
  );

  const buildGeneratorConfig = () => {
    return {
      // Project basics
      projectName: config.projectName,
      projectDescription: config.projectDescription,
      projectType: config.projectType,
      architecturePattern: config.architecturePattern,
      architecturePatternOther: config.architecturePatternOther,
      devOS: config.devOS,
      
      // Tech stack
      languages: config.languages,
      frameworks: config.frameworks,
      databases: config.databases,
      letAiDecide: config.letAiDecide,
      
      // Repository
      repoHost: config.repoHost,
      repoHostOther: config.repoHostOther,
      repoHosts: config.repoHosts,
      multiRepoReason: config.multiRepoReason,
      repoUrl: config.repoUrl,
      exampleRepoUrl: config.exampleRepoUrl,
      documentationUrl: config.documentationUrl,
      isPublic: config.isPublic,
      
      // License
      license: config.license,
      licenseOther: config.licenseOther,
      licenseNotes: config.licenseNotes,
      
      // Git workflow
      conventionalCommits: config.conventionalCommits,
      semver: config.semver,
      dependabot: config.dependabot,
      
      // CI/CD & Deployment
      cicd: config.cicd ? [config.cicd] : [],
      deploymentTarget: config.deploymentTargets,
      buildContainer: config.buildContainer,
      containerRegistry: config.containerRegistry,
      customRegistry: config.containerRegistryOther,
      
      // Funding
      funding: config.funding,
      fundingYml: config.fundingYml,
      
      // AI behavior
      aiBehaviorRules: config.aiBehaviorRules,
      importantFiles: config.importantFiles,
      importantFilesOther: config.importantFilesOther,
      enableAutoUpdate: config.enableAutoUpdate,
      includePersonalData: config.includePersonalData,
      
      // Platform & output
      platform: config.platform,
      platforms: [config.platform],
      blueprintMode: config.blueprintMode,
      additionalFeedback: config.additionalFeedback,
      
      // Commands
      commands: config.commands,
      
      // Code style (including error handling other)
      codeStyle: {
        ...config.codeStyle,
        errorHandlingOther: config.codeStyle.errorHandlingOther,
      },
      
      // Boundaries
      boundaries: config.boundaries,
      
      // Testing strategy
      testingStrategy: {
        levels: config.testing.levels,
        coverage: config.testing.coverage,
        frameworks: config.testing.frameworks,
        notes: config.testing.notes,
      },
      
      // Static files
      staticFiles: {
        funding: config.funding || config.staticFiles.funding,
        fundingYml: config.staticFiles.fundingYml || config.fundingYml,
        editorconfig: config.staticFiles.editorconfig,
        editorconfigCustom: config.staticFiles.editorconfigCustom,
        contributing: config.staticFiles.contributing,
        contributingCustom: config.staticFiles.contributingCustom,
        codeOfConduct: config.staticFiles.codeOfConduct,
        codeOfConductCustom: config.staticFiles.codeOfConductCustom,
        security: config.staticFiles.security,
        securityCustom: config.staticFiles.securityCustom,
        roadmap: config.staticFiles.roadmap,
        roadmapCustom: config.staticFiles.roadmapCustom,
        gitignoreMode: config.staticFiles.gitignoreMode,
        gitignoreCustom: config.staticFiles.gitignoreCustom,
        dockerignoreMode: config.buildContainer ? (config.staticFiles.dockerignoreMode === "skip" ? "generate" : config.staticFiles.dockerignoreMode) : config.staticFiles.dockerignoreMode,
        dockerignoreCustom: config.staticFiles.dockerignoreCustom,
        license: config.license,
      },
    };
  };

  // Extract [[VARIABLE]] or [[VARIABLE|default]] patterns from content
  const extractVariables = (content: string): string[] => {
    const regex = /\[\[([A-Z_][A-Z0-9_]*)(?:\|[^\]]*)?\]\]/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  };

  // Extract variables WITH their defaults - returns { name, default } pairs
  const extractVariablesWithDefaults = (content: string): Array<{ name: string; defaultVal: string | undefined }> => {
    const regex = /\[\[([A-Z_][A-Z0-9_]*)(?:\|([^\]]*))?\]\]/g;
    const vars = new Map<string, string | undefined>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, varName, defaultVal] = match;
      // Keep the first default we find (don't overwrite if already exists with a default)
      if (!vars.has(varName) || (vars.get(varName) === undefined && defaultVal !== undefined)) {
        vars.set(varName, defaultVal);
      }
    }
    return Array.from(vars.entries()).map(([name, defaultVal]) => ({ name, defaultVal }));
  };

  // Get all variables from all preview files
  const allVariables = useMemo(() => {
    const vars = new Set<string>();
    previewFiles.forEach(file => {
      extractVariables(file.content).forEach(v => vars.add(v));
    });
    // Also check additionalFeedback for variables
    extractVariables(config.additionalFeedback).forEach(v => vars.add(v));
    return Array.from(vars);
  }, [previewFiles, config.additionalFeedback]);

  // Get variables that have NO default (these need user input)
  const variablesWithoutDefaults = useMemo(() => {
    const allVarsWithDefaults: Array<{ name: string; defaultVal: string | undefined }> = [];
    previewFiles.forEach(file => {
      extractVariablesWithDefaults(file.content).forEach(v => allVarsWithDefaults.push(v));
    });
    extractVariablesWithDefaults(config.additionalFeedback).forEach(v => allVarsWithDefaults.push(v));
    
    // Build a map of variable -> has default
    const varDefaultMap = new Map<string, boolean>();
    allVarsWithDefaults.forEach(({ name, defaultVal }) => {
      if (varDefaultMap.has(name)) {
        // If already has a default, keep it true; only set false if currently false and no default
        if (defaultVal !== undefined) {
          varDefaultMap.set(name, true);
        }
      } else {
        varDefaultMap.set(name, defaultVal !== undefined);
      }
    });
    
    // Return names that have no default
    return Array.from(varDefaultMap.entries())
      .filter(([, hasDefault]) => !hasDefault)
      .map(([name]) => name);
  }, [previewFiles, config.additionalFeedback]);

  // Replace variables in content (handles [[VAR]] and [[VAR|default]] syntax)
  const replaceVariablesInContent = (content: string): string => {
    return content.replace(/\[\[([A-Z_][A-Z0-9_]*)(?:\|([^\]]*))?\]\]/g, (match, varName, defaultVal) => {
      const userValue = variableValues[varName];
      if (userValue !== undefined && userValue !== "") {
        return userValue;
      }
      if (defaultVal !== undefined) {
        return defaultVal;
      }
      return match;
    });
  };

  // Generate preview when entering the generate step (regardless of how user got there)
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1 && session?.user) {
      const files = generateAllFiles(buildGeneratorConfig(), {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
        tier: userTier, // Pass user tier to respect feature access
      });
      setPreviewFiles(files);
      // When files change (e.g., IDE switch), always keep the first file expanded
      // This ensures the user always sees content, even after switching platforms
      if (files.length > 0) {
        setExpandedFile(files[0].fileName);
      }
    }
  }, [currentStep, session?.user, config, userTier]);

  // Auth/loading gates must live after all hooks to keep hook order stable
  if (status === "loading" || tierLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <LoginRequired />;
  }

  if (!session.user.profileCompleted) {
    return <ProfileSetupRequired />;
  }

  // Helper to change step and scroll to top
  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep >= WIZARD_STEPS.length - 1) return;
    let next = currentStep + 1;
    while (next < WIZARD_STEPS.length && !canAccessTier(userTier, WIZARD_STEPS[next].tier)) {
      next++;
    }
    if (next >= WIZARD_STEPS.length) next = WIZARD_STEPS.length - 1;
    goToStep(next);
  };

  const handleCopyFile = async (fileName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Find previous accessible step
      let prevStep = currentStep - 1;
      while (prevStep >= 0 && !canAccessTier(userTier, WIZARD_STEPS[prevStep].tier)) {
        prevStep--;
      }
      if (prevStep >= 0) {
        goToStep(prevStep);
      }
    }
  };

  const toggleArrayValue = (
    key: "languages" | "frameworks" | "databases" | "aiBehaviorRules" | "importantFiles",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const savePreferences = async () => {
    console.log("[savePreferences] Function called!");
    console.log("[savePreferences] fundingSave:", config.staticFiles.fundingSave);
    console.log("[savePreferences] editorconfigSave:", config.staticFiles.editorconfigSave);
    console.log("[savePreferences] contributingSave:", config.staticFiles.contributingSave);
    console.log("[savePreferences] codeOfConductSave:", config.staticFiles.codeOfConductSave);
    console.log("[savePreferences] securitySave:", config.staticFiles.securitySave);
    console.log("[savePreferences] gitignoreSave:", config.staticFiles.gitignoreSave);
    console.log("[savePreferences] dockerignoreSave:", config.staticFiles.dockerignoreSave);
    console.log("[savePreferences] licenseSave:", config.staticFiles.licenseSave);
    const payload: { category: string; key: string; value: any; isDefault?: boolean }[] = [];
    if (config.commands.savePreferences) {
      payload.push(
        { category: "commands", key: "build", value: config.commands.build },
        { category: "commands", key: "test", value: config.commands.test },
        { category: "commands", key: "lint", value: config.commands.lint },
        { category: "commands", key: "dev", value: config.commands.dev },
      );
    }
    if (config.staticFiles.licenseSave) {
      payload.push(
        { category: "repo", key: "license", value: config.license, isDefault: true },
        { category: "repo", key: "host", value: config.repoHost },
        { category: "repo", key: "isPublic", value: config.isPublic },
      );
    }
    if (config.codeStyle.savePreferences) {
      payload.push(
        { category: "codeStyle", key: "naming", value: config.codeStyle.naming },
        { category: "codeStyle", key: "notes", value: config.codeStyle.notes },
      );
    }
    if (config.testing.savePreferences) {
      payload.push(
        { category: "testing", key: "levels", value: config.testing.levels.join(",") },
        { category: "testing", key: "coverage", value: String(config.testing.coverage) },
        { category: "testing", key: "frameworks", value: config.testing.frameworks.join(",") },
        { category: "testing", key: "notes", value: config.testing.notes },
      );
    }
    // Save each static file individually based on its save flag
    if (config.staticFiles.editorconfigSave) {
      payload.push(
        { category: "static", key: "editorconfig", value: String(config.staticFiles.editorconfig) },
        { category: "static", key: "editorconfigCustom", value: config.staticFiles.editorconfigCustom || "" },
      );
    }
    if (config.staticFiles.contributingSave) {
      payload.push(
        { category: "static", key: "contributing", value: String(config.staticFiles.contributing) },
        { category: "static", key: "contributingCustom", value: config.staticFiles.contributingCustom || "" },
      );
    }
    if (config.staticFiles.codeOfConductSave) {
      payload.push(
        { category: "static", key: "codeOfConduct", value: String(config.staticFiles.codeOfConduct) },
        { category: "static", key: "codeOfConductCustom", value: config.staticFiles.codeOfConductCustom || "" },
      );
    }
    if (config.staticFiles.securitySave) {
      payload.push(
        { category: "static", key: "security", value: String(config.staticFiles.security) },
        { category: "static", key: "securityCustom", value: config.staticFiles.securityCustom || "" },
      );
    }
    if (config.staticFiles.gitignoreSave) {
      payload.push(
        { category: "static", key: "gitignoreMode", value: config.staticFiles.gitignoreMode },
        { category: "static", key: "gitignoreCustom", value: config.staticFiles.gitignoreCustom || "" },
      );
    }
    if (config.staticFiles.dockerignoreSave) {
      payload.push(
        { category: "static", key: "dockerignoreMode", value: config.staticFiles.dockerignoreMode },
        { category: "static", key: "dockerignoreCustom", value: config.staticFiles.dockerignoreCustom || "" },
      );
    }
    if (config.staticFiles.fundingSave) {
      // Only save the FUNDING.yml content, no separate boolean flag needed
      payload.push(
        { category: "static", key: "FUNDING.yml", value: config.staticFiles.fundingYml || config.fundingYml || "" },
      );
    }
    if (config.staticFiles.licenseSave) {
      // Save license to general category (appears in General section of wizard preferences)
      payload.push(
        { category: "general", key: "license", value: config.license, isDefault: true },
      );
    }
    console.log("[savePreferences] payload to save:", payload);
    if (payload.length === 0) {
      console.log("[savePreferences] No preferences to save, payload is empty");
      return;
    }
    try {
      const response = await fetch("/api/user/wizard-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log("[savePreferences] API response:", result);
    } catch (error) {
      console.error("[savePreferences] Error saving preferences:", error);
    }
  };

  // Check for unfilled variables before download
  const handleDownloadClick = async () => {
    // If API sync is enabled, ALL variables without defaults must be filled (mandatory)
    // Otherwise, only prompt for unfilled variables
    const unfilledWithoutDefaults = variablesWithoutDefaults.filter(v => !variableValues[v]);
    
    if (unfilledWithoutDefaults.length > 0) {
      setShowVariableModal(true);
      return;
    }
    
    // If API sync is enabled, check for existing blueprint with same name
    if (config.enableApiSync && config.projectName) {
      try {
        const res = await fetch(`/api/blueprints?name=${encodeURIComponent(config.projectName)}&checkOwned=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.existingId) {
            setExistingBlueprintId(data.existingId);
            setShowOverwriteModal(true);
            return;
          }
        }
      } catch {
        // If check fails, proceed without overwrite check
      }
    }
    
    await handleDownload();
  };

  // Handle overwrite confirmation
  const handleOverwriteConfirm = async (overwrite: boolean) => {
    setShowOverwriteModal(false);
    if (overwrite) {
      await handleDownload(existingBlueprintId || undefined);
    }
    setExistingBlueprintId(null);
  };

  const handleDownload = async (overwriteBlueprintId?: string) => {
    setIsDownloading(true);
    setIsSavingBlueprint(config.enableApiSync);
    
    try {
      await savePreferences();
      const userProfile = {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
        tier: userTier, // Pass user tier to respect feature access
      };
      
      // Build config (keep variables intact for blueprint saving)
      const genConfig = buildGeneratorConfig();
      
      const blob = await generateConfigFiles(genConfig, userProfile);
      let files = generateAllFiles(genConfig, userProfile);
      
      // Keep original content with variables intact for blueprint saving
      const originalContent = files[0]?.content || "";
      
      // If API sync is enabled, save/update the blueprint first (with variables intact)
      let blueprintId: string | null = null;
      if (config.enableApiSync && files.length > 0) {
        try {
          const blueprintData = {
            name: config.projectName || "My AI Config",
            description: config.projectDescription || "Generated with the LynxPrompt wizard",
            content: originalContent, // Keep [[VAR|default]] syntax for blueprints
            type: "AGENTS_MD",
            category: "other",
            visibility: "PRIVATE",
          };

          let res: Response;
          if (overwriteBlueprintId) {
            // Update existing blueprint
            res = await fetch(`/api/blueprints/${overwriteBlueprintId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(blueprintData),
            });
          } else {
            // Create new blueprint
            res = await fetch("/api/blueprints", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(blueprintData),
            });
          }

          if (res.ok) {
            const data = await res.json();
            blueprintId = data.template?.id || overwriteBlueprintId;
            setSavedBlueprintId(blueprintId);
          } else {
            console.error("Failed to save blueprint for API sync");
          }
        } catch (error) {
          console.error("Error saving blueprint:", error);
        }
      }
      
      // NOW replace variables for the download (after blueprint was saved with variables intact)
      files = files.map(file => ({
        ...file,
        content: replaceVariablesInContent(file.content),
      }));
      
      // Also replace variables in additionalFeedback for genConfig (used by generateConfigFiles)
      genConfig.additionalFeedback = replaceVariablesInContent(genConfig.additionalFeedback);
      
      // If we have a blueprint ID, prepend API sync header to the content
      let finalContent = files[0]?.content || "";
      if (config.enableApiSync && blueprintId) {
        const apiHeader = generateApiSyncHeader(blueprintId, files[0]?.fileName || "AGENTS.md");
        finalContent = apiHeader + finalContent;
        files = files.map((file, i) => i === 0 ? { ...file, content: finalContent } : file);
      }
      
      // Create new blob with final content (variables already replaced)
      const finalBlob = files.length > 0 
        ? new Blob([finalContent], { type: "text/plain" })
        : blob;
      
      downloadConfigFile(finalBlob, files);
      
      // After successful download, ask about draft deletion and blueprint saving
      if (currentDraftId) {
        setPendingAction("download");
        setShowDeleteDraftModal(true);
      } else {
        // No draft, ask if they want to save as blueprint
        setPendingAction("download");
        setShowSaveBlueprintModal(true);
      }
    } catch (error) {
      console.error("Error generating files:", error);
      alert("Failed to generate files. Please try again.");
    } finally {
      setIsDownloading(false);
      setIsSavingBlueprint(false);
      setShowVariableModal(false);
    }
  };
  
  // Generate API sync header for the downloaded file - OS-specific commands
  const generateApiSyncHeader = (blueprintId: string, fileName: string) => {
    const bpId = blueprintId.startsWith("bp_") ? blueprintId : `bp_${blueprintId}`;
    const devOS = config.devOS || "linux";
    
    // Generate OS-specific curl command
    let curlCommand = "";
    
    if (devOS === "windows") {
      // PowerShell command for Windows
      curlCommand = `#   # PowerShell (Windows)
#   $content = (Get-Content "${fileName}" -Raw) -replace '"', '\\"'
#   $body = @{ content = $content } | ConvertTo-Json
#   Invoke-RestMethod -Uri "https://lynxprompt.com/api/v1/blueprints/${bpId}" \`
#     -Method PUT \`
#     -Headers @{ "Authorization" = "Bearer $env:LYNXPROMPT_API_TOKEN"; "Content-Type" = "application/json" } \`
#     -Body $body`;
    } else if (devOS === "wsl") {
      // WSL uses bash but might need Windows path awareness
      curlCommand = `#   # Bash (WSL/Linux)
#   curl -X PUT "https://lynxprompt.com/api/v1/blueprints/${bpId}" \\
#     -H "Authorization: Bearer \$LYNXPROMPT_API_TOKEN" \\
#     -H "Content-Type: application/json" \\
#     -d "{\\"content\\": \\"$(cat ${fileName} | jq -Rs .)\\"}"\n#
#   # Note: Install jq if not present: sudo apt install jq`;
    } else if (devOS === "multi") {
      // Show both options for cross-platform
      curlCommand = `#   # Linux/macOS (bash):
#   curl -X PUT "https://lynxprompt.com/api/v1/blueprints/${bpId}" \\
#     -H "Authorization: Bearer \$LYNXPROMPT_API_TOKEN" \\
#     -H "Content-Type: application/json" \\
#     -d "{\\"content\\": \\"$(cat ${fileName} | jq -Rs .)\\"}"\n#
#   # Windows (PowerShell):
#   $content = (Get-Content "${fileName}" -Raw) -replace '"', '\\"'
#   Invoke-RestMethod -Uri "https://lynxprompt.com/api/v1/blueprints/${bpId}" \`
#     -Method PUT -Headers @{ "Authorization" = "Bearer \$env:LYNXPROMPT_API_TOKEN" } \`
#     -Body (@{ content = $content } | ConvertTo-Json)`;
    } else {
      // Linux/macOS default - use jq for proper JSON escaping
      curlCommand = `#   curl -X PUT "https://lynxprompt.com/api/v1/blueprints/${bpId}" \\
#     -H "Authorization: Bearer \$LYNXPROMPT_API_TOKEN" \\
#     -H "Content-Type: application/json" \\
#     -d "{\\"content\\": \\"$(cat ${fileName} | jq -Rs .)\\"}"`;
    }
    
    return `# ${config.projectName || fileName}
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 LynxPrompt API Sync
# Blueprint ID: ${bpId}
# 
# This file is synced with LynxPrompt. To update it via API:
#
${curlCommand}
#
# Generate an API token at: https://lynxprompt.com/settings
# Docs: https://lynxprompt.com/docs/api
#
# Note: Requires an API token with "Edit blueprints" permission.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  };

  // Handle saving as blueprint
  const handleShareAsBlueprint = () => {
    // Get the generated content (keep variables intact for blueprints)
    if (previewFiles.length === 0) return;
    const content = previewFiles[0].content; // Don't replace variables - blueprints should keep [[VAR|default]] syntax
    // Store in sessionStorage for the create page to pick up
    sessionStorage.setItem("wizardBlueprintContent", content);
    sessionStorage.setItem("wizardBlueprintName", config.projectName || "My AI Config");
    sessionStorage.setItem("wizardBlueprintDescription", config.projectDescription || "Generated with the LynxPrompt wizard");
    
    // If there's a draft, ask if user wants to delete it before navigating
    if (currentDraftId) {
      setPendingAction("share");
      setShowDeleteDraftModal(true);
    } else {
      // Navigate to create blueprint page
      window.location.href = "/blueprints/create";
    }
  };
  
  // Handle delete draft confirmation after download/share
  const handleDeleteDraftConfirm = async (shouldDelete: boolean) => {
    if (shouldDelete && currentDraftId) {
      try {
        await fetch(`/api/wizard/drafts/${currentDraftId}`, {
          method: "DELETE",
        });
        setCurrentDraftId(null);
        setDraftName("");
      } catch (error) {
        console.error("Failed to delete draft:", error);
      }
    }
    setShowDeleteDraftModal(false);
    
    // After draft decision, proceed with next step
    if (pendingAction === "share") {
      window.location.href = "/blueprints/create";
    } else if (pendingAction === "download") {
      // Show save blueprint modal for download action
      setShowSaveBlueprintModal(true);
    }
    setPendingAction(null);
  };
  
  // Handle save blueprint confirmation after download
  const handleSaveBlueprintConfirm = (shouldSave: boolean) => {
    setShowSaveBlueprintModal(false);
    if (shouldSave) {
      // Navigate to create blueprint page with the content (keep variables intact)
      if (previewFiles.length > 0) {
        const content = previewFiles[0].content; // Don't replace variables - blueprints should keep [[VAR|default]] syntax
        sessionStorage.setItem("wizardBlueprintContent", content);
        sessionStorage.setItem("wizardBlueprintName", config.projectName || "My AI Config");
        sessionStorage.setItem("wizardBlueprintDescription", config.projectDescription || "Generated with the LynxPrompt wizard");
        window.location.href = "/blueprints/create";
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Variable Fill Modal */}
      {showVariableModal && variablesWithoutDefaults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowVariableModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close variable modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold">Fill in Required Variables</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These variables don&apos;t have default values. {config.enableApiSync ? "All values are required for API sync." : "Please provide values for them:"}
            </p>
            {config.enableApiSync && (
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                🔄 API Sync is enabled. Variables must be filled to ensure the downloaded file works correctly.
              </div>
            )}
            
            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto">
              {variablesWithoutDefaults.map(varName => (
                <div key={varName}>
                  <label className="text-sm font-medium">
                    <code className="rounded bg-amber-200 px-2 py-0.5 text-amber-800 dark:bg-amber-800 dark:text-amber-200">[[{varName}]]</code>
                    <span className="ml-2 text-xs text-destructive">(no default)</span>
                  </label>
                  <input
                    type="text"
                    value={variableValues[varName] || ""}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [varName]: e.target.value }))}
                    placeholder={`Enter value for ${varName}`}
                    className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVariableModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleDownload()}
                disabled={isDownloading || variablesWithoutDefaults.some(v => !variableValues[v])}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Blueprint Already Exists</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You already have a blueprint named <strong>&quot;{config.projectName}&quot;</strong>.
              Do you want to overwrite it with this new configuration?
            </p>
            
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <strong>Note:</strong> The existing blueprint will be updated with the new content.
              The blueprint ID will remain the same, so existing API integrations will continue to work.
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOverwriteConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleOverwriteConfirm(true)}>
                Yes, Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowDraftModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">
              {currentDraftId ? "Update Draft" : "Save Draft"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save your progress and continue later. Your configuration will be preserved at step {currentStep + 1}.
            </p>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Draft Name
              </label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="My Project Config"
                className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDraftModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !draftName.trim()}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {currentDraftId ? "Update" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {showLoadDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowLoadDraftModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Load Draft</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Resume a saved configuration. Loading a draft will replace your current progress.
            </p>
            
            <div className="mt-4 max-h-80 overflow-y-auto">
              {drafts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FolderOpen className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No saved drafts yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                        currentDraftId === draft.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{draft.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {draft.projectName || "Untitled Project"} • Step {draft.step + 1}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {draft.languages?.slice(0, 3).map((lang: string) => (
                              <span
                                key={lang}
                                className="text-xs px-2 py-0.5 rounded bg-muted"
                              >
                                {lang}
                              </span>
                            ))}
                            {(draft.languages?.length ?? 0) > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                +{draft.languages.length - 3}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={isDeletingDraft === draft.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {isDeletingDraft === draft.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleLoadDraft(draft.id)}
                            disabled={isLoadingDraft}
                          >
                            {isLoadingDraft ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Load"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowLoadDraftModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      {showDeleteDraftModal && currentDraftId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => handleDeleteDraftConfirm(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Delete Draft?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have a saved draft: <strong>&quot;{draftName}&quot;</strong>. Would you like to delete it now that you&apos;ve finished your configuration?
            </p>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleDeleteDraftConfirm(false)}>
                Keep Draft
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleDeleteDraftConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Blueprint Confirmation Modal (after Download) */}
      {showSaveBlueprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <button
              onClick={() => handleSaveBlueprintConfirm(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">Save Blueprint to Profile?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI config file has been downloaded. Would you like to also save this blueprint to your dashboard for easy access and sharing?
            </p>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleSaveBlueprintConfirm(false)}>
                No, Thanks
              </Button>
              <Button 
                onClick={() => handleSaveBlueprintConfirm(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Blueprint
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader currentPage="wizard" breadcrumbLabel="Wizard" />

      <div className="container mx-auto flex flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar - Step Navigation */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-2">
            {/* User Profile Info */}
            <div className="mb-6 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg">
                      {
                        (session.user.displayName ||
                          session.user.name ||
                          "U")[0]
                      }
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.user.displayName || session.user.name || "User"}
                  </p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {session.user.persona || "Developer"} • {session.user.skillLevel || "Intermediate"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="mt-2 w-full">
                <Link href="/settings/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isLocked = !canAccessTier(userTier, step.tier);
              const tierBadge = getTierBadge(step.tier);

              return (
                <button
                  key={step.id}
                  onClick={() => !isLocked && goToStep(index)}
                  disabled={isLocked}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    isLocked
                      ? "cursor-not-allowed opacity-50"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isLocked
                        ? "bg-muted"
                        : isActive
                          ? "bg-primary-foreground/20"
                          : isCompleted
                            ? "bg-primary/20"
                            : "bg-muted"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{step.title}</span>
                  {tierBadge && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tierBadge.className}`}>
                      {tierBadge.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Upgrade prompt if there are locked steps */}
            {lockedSteps.length > 0 && (
              <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>{lockedSteps.length} step{lockedSteps.length > 1 ? "s" : ""} locked</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upgrade to unlock {userTier === "free" ? "Pro and Max" : "Max"} features
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/pricing">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl">
            {/* Progress Bar (Mobile) */}
            <div className="mb-6 lg:hidden">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </span>
                <span className="text-muted-foreground">
                  {WIZARD_STEPS[currentStep].title}
                </span>
              </div>
              <progress
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                value={currentStep + 1}
                max={WIZARD_STEPS.length}
                aria-label="Wizard progress"
              />
            </div>

            {/* Step Content */}
            <div className="rounded-xl border bg-card p-8">
              {currentStep === 0 && (
                <StepProject
                  name={config.projectName}
                  description={config.projectDescription}
                  projectType={config.projectType}
                  architecturePattern={config.architecturePattern}
                  architecturePatternOther={config.architecturePatternOther}
                  devOS={config.devOS}
                  blueprintMode={config.blueprintMode}
                  userTier={userTier}
                  repoDetectUrl={repoDetectUrl}
                  isDetecting={isDetecting}
                  detectError={detectError}
                  detectedData={detectedData}
                  onNameChange={(v) => setConfig({ ...config, projectName: v })}
                  onDescriptionChange={(v) => setConfig({ ...config, projectDescription: v })}
                  onProjectTypeChange={(v) => setConfig({ ...config, projectType: v })}
                  onArchitecturePatternChange={(v) => setConfig({ ...config, architecturePattern: v })}
                  onArchitecturePatternOtherChange={(v) => setConfig({ ...config, architecturePatternOther: v })}
                  onDevOSChange={(v) => setConfig({ ...config, devOS: v })}
                  onBlueprintModeChange={(v) => setConfig({ ...config, blueprintMode: v })}
                  onRepoUrlChange={(v) => setRepoDetectUrl(v)}
                  onDetectRepo={handleDetectRepo}
                  onApplyDetected={applyDetectedData}
                />
              )}
              {currentStep === 1 && (
                <StepTechStack
                  selectedLanguages={config.languages}
                  selectedFrameworks={config.frameworks}
                  selectedDatabases={config.databases}
                  letAiDecide={config.letAiDecide}
                  onToggleLanguage={(v) => toggleArrayValue("languages", v)}
                  onToggleFramework={(v) => toggleArrayValue("frameworks", v)}
                  onToggleDatabase={(v) => toggleArrayValue("databases", v)}
                  onLetAiDecide={(v) => setConfig({ ...config, letAiDecide: v })}
                />
              )}
              {currentStep === 2 && (
                <StepRepository
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 3 && (
                <StepCommands
                  config={config.commands}
                  onChange={(updates) => setConfig({ ...config, commands: { ...config.commands, ...updates } })}
                />
              )}
              {currentStep === 4 && (
                <StepCodeStyle
                  config={config.codeStyle}
                  onChange={(updates) => setConfig({ ...config, codeStyle: { ...config.codeStyle, ...updates } })}
                  selectedLanguages={config.languages}
                />
              )}
              {currentStep === 5 && (
                <StepAIBehavior
                  selected={config.aiBehaviorRules}
                  onToggle={(v) => toggleArrayValue("aiBehaviorRules", v)}
                  importantFiles={config.importantFiles}
                  importantFilesOther={config.importantFilesOther}
                  onImportantFilesToggle={(v) => toggleArrayValue("importantFiles", v)}
                  onImportantFilesOtherChange={(v) => setConfig({ ...config, importantFilesOther: v })}
                  enableAutoUpdate={config.enableAutoUpdate}
                  onAutoUpdateChange={(v) => setConfig({ ...config, enableAutoUpdate: v })}
                  includePersonalData={config.includePersonalData}
                  onIncludePersonalDataChange={(v) => setConfig({ ...config, includePersonalData: v })}
                  userPersona={session.user.persona}
                  userSkillLevel={session.user.skillLevel}
                />
              )}
              {currentStep === 6 && (
                <StepBoundaries
                  config={config.boundaries}
                  onChange={(updates) => setConfig({ ...config, boundaries: { ...config.boundaries, ...updates } })}
                />
              )}
              {currentStep === 7 && (
                <StepTesting
                  config={config.testing}
                  onChange={(updates) => setConfig({ ...config, testing: { ...config.testing, ...updates } })}
                />
              )}
              {currentStep === 8 && (
                <StepStaticFiles
                  config={config.staticFiles}
                  isGithub={config.repoHost === "github"}
                  isPublic={config.isPublic}
                  buildContainer={config.buildContainer}
                  onChange={(updates) => setConfig({ ...config, staticFiles: { ...config.staticFiles, ...updates } })}
                />
              )}
              {currentStep === 9 && (
                <StepFeedback
                  value={config.additionalFeedback}
                  onChange={(v) => setConfig({ ...config, additionalFeedback: v })}
                  userTier={userTier}
                />
              )}
              {currentStep === 10 && (
                <StepGenerate
                  config={config}
                  session={session}
                  previewFiles={previewFiles}
                  expandedFile={expandedFile}
                  copiedFile={copiedFile}
                  blueprintMode={config.blueprintMode}
                  enableApiSync={config.enableApiSync}
                  userTier={userTier}
                  onToggleExpand={(fileName) => setExpandedFile(expandedFile === fileName ? null : fileName)}
                  onCopyFile={handleCopyFile}
                  onPlatformChange={(v) => setConfig({ ...config, platform: v })}
                  onApiSyncChange={(v) => setConfig({ ...config, enableApiSync: v })}
                />
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  {/* Draft buttons */}
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoadDraftModal(true)}
                    title="Load Draft"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="sr-only">Load Draft</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!draftName && config.projectName) {
                        setDraftName(config.projectName);
                      }
                      setShowDraftModal(true);
                    }}
                    title="Save Draft"
                  >
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Save Draft</span>
                  </Button>
                </div>
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleShareAsBlueprint}
                      disabled={isDownloading || previewFiles.length === 0}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share/Save Blueprint
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={handleDownloadClick}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download AI Config File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Default export with Suspense boundary for useSearchParams
export default function WizardPage() {
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      <WizardPageContent />
    </Suspense>
  );
}

// Loading fallback for the wizard page
function WizardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading wizard...</div>
    </div>
  );
}

// NEW: Project Info Step
const DEV_OS_OPTIONS = [
  { id: "linux", label: "Linux", icon: "🐧", desc: "Ubuntu, Debian, Fedora, Arch..." },
  { id: "macos", label: "macOS", icon: "🍎", desc: "Mac with zsh/bash" },
  { id: "windows", label: "Windows", icon: "🪟", desc: "PowerShell, CMD, or WSL" },
  { id: "wsl", label: "Windows + WSL", icon: "🐧🪟", desc: "Windows with Linux subsystem" },
  { id: "multi", label: "Multi-platform", icon: "🌐", desc: "Cross-platform commands" },
];

function StepProject({
  name,
  description,
  projectType,
  architecturePattern,
  architecturePatternOther,
  devOS,
  blueprintMode,
  userTier,
  repoDetectUrl,
  isDetecting,
  detectError,
  detectedData,
  onNameChange,
  onDescriptionChange,
  onProjectTypeChange,
  onArchitecturePatternChange,
  onArchitecturePatternOtherChange,
  onDevOSChange,
  onBlueprintModeChange,
  onRepoUrlChange,
  onDetectRepo,
  onApplyDetected,
}: {
  name: string;
  description: string;
  projectType: string;
  architecturePattern: string;
  architecturePatternOther: string;
  devOS: string;
  blueprintMode: boolean;
  userTier: string;
  repoDetectUrl: string;
  isDetecting: boolean;
  detectError: string | null;
  detectedData: {
    name: string | null;
    description: string | null;
    stack: string[];
    commands: { build?: string; test?: string; lint?: string; dev?: string };
    license: string | null;
    repoHost: string;
    cicd: string | null;
    hasDocker: boolean;
    containerRegistry: string | null;
    testFramework: string | null;
    existingFiles: string[];
    isOpenSource: boolean;
    projectType: string | null;
  } | null;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
  onArchitecturePatternChange: (v: string) => void;
  onArchitecturePatternOtherChange: (v: string) => void;
  onDevOSChange: (v: string) => void;
  onBlueprintModeChange: (v: boolean) => void;
  onRepoUrlChange: (v: string) => void;
  onDetectRepo: () => void;
  onApplyDetected: () => void;
}) {
  const canDetect = userTier === "max" || userTier === "teams";

  return (
    <div>
      <h2 className="text-2xl font-bold">What project is this for?</h2>
      <p className="mt-2 text-muted-foreground">
        Tell us about the repository you&apos;re setting up AI configurations
        for.
      </p>

      <div className="mt-6 space-y-6">
        {/* Repository Auto-Detection (Max/Teams) */}
        <div className={`rounded-lg border-2 p-4 transition-colors ${canDetect ? "border-primary/30 bg-primary/5" : "border-dashed border-muted-foreground/20 bg-muted/30"}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <label className="text-sm font-medium">
                  🔍 Auto-detect from existing repository
                </label>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${canDetect ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                  <Crown className="h-3 w-3" />
                  Max
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {canDetect 
                  ? "Enter a public GitHub repository URL to auto-detect tech stack, license, CI/CD, and more."
                  : "Upgrade to Max or Teams to auto-detect configuration from your existing repositories."}
              </p>
              
              {canDetect && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={repoDetectUrl}
                      onChange={(e) => onRepoUrlChange(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isDetecting}
                    />
                    <button
                      onClick={onDetectRepo}
                      disabled={isDetecting || !repoDetectUrl.trim()}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isDetecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Detect
                        </>
                      )}
                    </button>
                  </div>

                  {detectError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {detectError}
                    </div>
                  )}

                  {detectedData && (
                    <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-green-800 dark:text-green-200">
                          ✓ Repository detected!
                        </h4>
                        <button
                          onClick={onApplyDetected}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Apply to wizard
                        </button>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                        {detectedData.name && <p>• Name: <strong>{detectedData.name}</strong></p>}
                        {detectedData.isOpenSource && <p>• Type: <strong>Open Source</strong></p>}
                        {detectedData.stack.length > 0 && (
                          <p>• Stack: {detectedData.stack.slice(0, 6).join(", ")}{detectedData.stack.length > 6 ? "..." : ""}</p>
                        )}
                        {detectedData.license && <p>• License: {detectedData.license.toUpperCase()}</p>}
                        {detectedData.repoHost && <p>• Host: {detectedData.repoHost}</p>}
                        {detectedData.cicd && <p>• CI/CD: {detectedData.cicd.replace(/_/g, " ")}</p>}
                        {detectedData.testFramework && <p>• Test framework: {detectedData.testFramework}</p>}
                        {detectedData.hasDocker && (
                          <p>• Docker: detected{detectedData.containerRegistry ? ` (registry: ${detectedData.containerRegistry})` : ""}</p>
                        )}
                        {detectedData.existingFiles.length > 0 && (
                          <p>• Static files found: {detectedData.existingFiles.length} ({detectedData.existingFiles.slice(0, 3).join(", ")}{detectedData.existingFiles.length > 3 ? "..." : ""})</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blueprint Template Mode - at the beginning */}
        <div className={`rounded-lg border-2 p-4 transition-colors ${blueprintMode ? "border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30" : "border-dashed border-muted-foreground/30"}`}>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  🧩 Create as Blueprint Template?
                </label>
                {blueprintMode && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Enabled
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Enable this to share your config as a reusable template. Values will be converted to{" "}
                <code className="rounded bg-amber-200 px-1 py-0.5 font-mono text-xs dark:bg-amber-800">[[VARIABLE|default]]</code>{" "}
                placeholders that others can customize.{" "}
                <a
                  href="/docs/blueprints/variables"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Learn more →
                </a>
              </p>
              {blueprintMode && (
                <div className="mt-3 rounded-md bg-amber-100 p-3 text-xs text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <strong>Note:</strong> The preview will show variables like <code className="font-mono">[[PROJECT_NAME|{name || "my-app"}]]</code>.
                  When downloading, defaults are applied so the file works immediately.
                </div>
              )}
            </div>
            <div
              onClick={() => onBlueprintModeChange(!blueprintMode)}
              className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${blueprintMode ? "bg-amber-500" : "bg-muted"}`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${blueprintMode ? "left-0.5 translate-x-5" : "left-0.5 translate-x-0"}`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., my-awesome-app, company-backend"
            className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description of what this project does..."
            rows={3}
            className="w-full resize-none rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Development Environment */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Development Environment
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            What OS are you developing on? This helps generate compatible commands.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEV_OS_OPTIONS.map((os) => (
              <button
                key={os.id}
                onClick={() => onDevOSChange(os.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                  devOS === os.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                <span>{os.icon}</span>
                <span>{os.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Project Type - affects AI behavior */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            What type of project is this?
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            This affects how the AI assistant behaves when helping you code.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => onProjectTypeChange(type.id)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all ${
                  projectType === type.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Architecture Pattern */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Architecture Pattern (optional)
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            What architectural approach does this project follow? Click again to deselect.
          </p>
          <div className="flex flex-wrap gap-2">
            {ARCHITECTURE_PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => onArchitecturePatternChange(architecturePattern === pattern.id ? "" : pattern.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  architecturePattern === pattern.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          {architecturePattern === "other" && (
            <input
              type="text"
              value={architecturePatternOther}
              onChange={(e) => onArchitecturePatternOtherChange(e.target.value)}
              placeholder="e.g., CQRS, Hexagonal, Clean Architecture..."
              className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          💡 The project type affects AI behavior: <strong>Work</strong> projects get strict procedure following, while <strong>Leisure</strong> projects allow more creativity.
        </p>
      </div>
    </div>
  );
}

// UPDATED: Tech Stack Step with search, load more, and AI decide that works with selections
function StepTechStack({
  selectedLanguages,
  selectedFrameworks,
  selectedDatabases,
  letAiDecide,
  onToggleLanguage,
  onToggleFramework,
  onToggleDatabase,
  onLetAiDecide,
}: {
  selectedLanguages: string[];
  selectedFrameworks: string[];
  selectedDatabases: string[];
  letAiDecide: boolean;
  onToggleLanguage: (v: string) => void;
  onToggleFramework: (v: string) => void;
  onToggleDatabase: (v: string) => void;
  onLetAiDecide: (v: boolean) => void;
}) {
  const [langSearch, setLangSearch] = useState("");
  const [fwSearch, setFwSearch] = useState("");
  const [dbSearch, setDbSearch] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  const [showAllDatabases, setShowAllDatabases] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customFramework, setCustomFramework] = useState("");
  const [customDatabase, setCustomDatabase] = useState("");
  const [showCustomLang, setShowCustomLang] = useState(false);
  const [showCustomFw, setShowCustomFw] = useState(false);
  const [showCustomDb, setShowCustomDb] = useState(false);

  const INITIAL_DISPLAY = 12;

  // Filter languages
  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.value.toLowerCase().includes(langSearch.toLowerCase())
  );
  const displayedLanguages = showAllLangs || langSearch 
    ? filteredLanguages 
    : filteredLanguages.slice(0, INITIAL_DISPLAY);
  const hasMoreLangs = !langSearch && filteredLanguages.length > INITIAL_DISPLAY;

  // Filter frameworks
  const filteredFrameworks = FRAMEWORKS.filter(fw => 
    fw.label.toLowerCase().includes(fwSearch.toLowerCase()) ||
    fw.value.toLowerCase().includes(fwSearch.toLowerCase())
  );
  const displayedFrameworks = showAllFrameworks || fwSearch 
    ? filteredFrameworks 
    : filteredFrameworks.slice(0, INITIAL_DISPLAY);
  const hasMoreFws = !fwSearch && filteredFrameworks.length > INITIAL_DISPLAY;

  // Filter databases - grouped by category
  const filteredDatabases = DATABASES.filter(db => 
    db.label.toLowerCase().includes(dbSearch.toLowerCase()) ||
    db.value.toLowerCase().includes(dbSearch.toLowerCase())
  );
  // Group by category for display
  const openSourceDbs = filteredDatabases.filter(db => db.category === "opensource");
  const cloudDbs = filteredDatabases.filter(db => db.category === "cloud");
  const proprietaryDbs = filteredDatabases.filter(db => db.category === "proprietary");
  const displayedOpenSource = showAllDatabases || dbSearch ? openSourceDbs : openSourceDbs.slice(0, 12);
  const displayedCloud = showAllDatabases || dbSearch ? cloudDbs : cloudDbs.slice(0, 8);
  const displayedProprietary = showAllDatabases || dbSearch ? proprietaryDbs : proprietaryDbs.slice(0, 4);
  const hasMoreDbs = !dbSearch && (openSourceDbs.length > 12 || cloudDbs.length > 8 || proprietaryDbs.length > 4);

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim()) {
      onToggleLanguage(`custom:${customLanguage.trim()}`);
      setCustomLanguage("");
      setShowCustomLang(false);
    }
  };

  const handleAddCustomFramework = () => {
    if (customFramework.trim()) {
      onToggleFramework(`custom:${customFramework.trim()}`);
      setCustomFramework("");
      setShowCustomFw(false);
    }
  };

  const handleAddCustomDatabase = () => {
    if (customDatabase.trim()) {
      onToggleDatabase(`custom:${customDatabase.trim()}`);
      setCustomDatabase("");
      setShowCustomDb(false);
    }
  };

  // Get custom items from selected
  const customLangs = selectedLanguages.filter(l => l.startsWith("custom:")).map(l => l.replace("custom:", ""));
  const customFws = selectedFrameworks.filter(f => f.startsWith("custom:")).map(f => f.replace("custom:", ""));
  const customDbs = selectedDatabases.filter(d => d.startsWith("custom:")).map(d => d.replace("custom:", ""));

  return (
    <div>
      <h2 className="text-2xl font-bold">Select Your Tech Stack</h2>
      <p className="mt-2 text-muted-foreground">
        Choose the languages and frameworks you&apos;ll be using. You can also let AI help with additional choices.
      </p>

      {/* Let AI Decide - Now works WITH selections */}
      <div className="mt-6">
        <button
          onClick={() => onLetAiDecide(!letAiDecide)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
            letAiDecide
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-dashed border-muted-foreground/30 hover:border-primary"
          }`}
        >
          <Brain className="h-5 w-5" />
          <span className="font-medium">
            Let AI help with additional technologies
          </span>
          {letAiDecide && <Check className="h-4 w-4 text-primary" />}
        </button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {letAiDecide 
            ? selectedLanguages.length > 0 || selectedFrameworks.length > 0
              ? "AI will analyze your codebase and suggest additional technologies beyond your selections"
              : "AI will analyze your codebase and suggest the best technologies for your project"
            : "Enable this to let AI suggest technologies based on your codebase"}
        </p>
      </div>

      {/* Languages */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Languages</h3>
          <span className="text-sm text-muted-foreground">
            {selectedLanguages.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedLanguages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onToggleLanguage(lang.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedLanguages.includes(lang.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{lang.icon}</span>
                <span className="truncate text-sm font-medium">{lang.label}</span>
              </button>
            ))}

            {/* Custom languages */}
            {customLangs.map((lang) => (
              <button
                key={`custom:${lang}`}
                onClick={() => onToggleLanguage(`custom:${lang}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{lang}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomLang && (
              <button
                onClick={() => setShowCustomLang(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreLangs && !showAllLangs && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom language input */}
        {showCustomLang && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="Enter language name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomLanguage()}
            />
            <button
              onClick={handleAddCustomLanguage}
              disabled={!customLanguage.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomLang(false); setCustomLanguage(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreLangs && (
          <button
            onClick={() => setShowAllLangs(!showAllLangs)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllLangs ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredLanguages.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Frameworks */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Frameworks & Libraries</h3>
          <span className="text-sm text-muted-foreground">
            {selectedFrameworks.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={fwSearch}
            onChange={(e) => setFwSearch(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedFrameworks.map((fw) => (
              <button
                key={fw.value}
                onClick={() => onToggleFramework(fw.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedFrameworks.includes(fw.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{fw.icon}</span>
                <span className="truncate text-sm font-medium">{fw.label}</span>
              </button>
            ))}

            {/* Custom frameworks */}
            {customFws.map((fw) => (
              <button
                key={`custom:${fw}`}
                onClick={() => onToggleFramework(`custom:${fw}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{fw}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomFw && (
              <button
                onClick={() => setShowCustomFw(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreFws && !showAllFrameworks && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom framework input */}
        {showCustomFw && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customFramework}
              onChange={(e) => setCustomFramework(e.target.value)}
              placeholder="Enter framework name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomFramework()}
            />
            <button
              onClick={handleAddCustomFramework}
              disabled={!customFramework.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomFw(false); setCustomFramework(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreFws && (
          <button
            onClick={() => setShowAllFrameworks(!showAllFrameworks)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllFrameworks ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredFrameworks.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Database Preference */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Database Preference</h3>
          <span className="text-sm text-muted-foreground">
            {selectedDatabases.length > 0 ? `${selectedDatabases.length} selected` : "Optional"}
          </span>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Select your preferred databases (optional). You can select multiple. This helps AI understand your data storage preferences.
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            placeholder="Search databases..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Open Source Databases */}
        {displayedOpenSource.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              🌿 Open Source
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedOpenSource.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cloud Managed Databases */}
        {displayedCloud.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ☁️ Cloud Managed
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedCloud.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Proprietary/Closed Source Databases */}
        {displayedProprietary.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              🔒 Proprietary / Enterprise
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayedProprietary.map((db) => (
                <button
                  key={db.value}
                  onClick={() => onToggleDatabase(db.value)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                    selectedDatabases.includes(db.value)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-lg">{db.icon}</span>
                  <span className="truncate text-sm font-medium">{db.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom database display */}
        {customDbs.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Custom
            </h4>
            <div className="flex flex-wrap gap-2">
              {customDbs.map((dbName) => (
                <button
                  key={dbName}
                  onClick={() => onToggleDatabase(`custom:${dbName}`)}
                  className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
                >
                  <span className="text-lg">📝</span>
                  <span className="truncate text-sm font-medium">{dbName}</span>
                  <X className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Other button */}
        {!showCustomDb && (
          <button
            onClick={() => setShowCustomDb(true)}
            className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Other database...</span>
          </button>
        )}

        {/* Custom database input */}
        {showCustomDb && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customDatabase}
              onChange={(e) => setCustomDatabase(e.target.value)}
              placeholder="Enter database name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomDatabase()}
            />
            <button
              onClick={handleAddCustomDatabase}
              disabled={!customDatabase.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomDb(false); setCustomDatabase(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreDbs && (
          <button
            onClick={() => setShowAllDatabases(!showAllDatabases)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllDatabases ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show all databases <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

const REPO_HOSTS = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "forgejo", label: "Forgejo", icon: "🔧" },
  { id: "bitbucket", label: "Bitbucket", icon: "🪣" },
  { id: "codeberg", label: "Codeberg", icon: "🏔️" },
  { id: "sourcehut", label: "SourceHut", icon: "📦" },
  { id: "gogs", label: "Gogs", icon: "🐙" },
  { id: "aws_codecommit", label: "AWS CodeCommit", icon: "☁️" },
  { id: "azure_devops", label: "Azure DevOps", icon: "☁️" },
  { id: "gerrit", label: "Gerrit", icon: "🔍" },
  { id: "phabricator", label: "Phabricator", icon: "📦" },
  { id: "other", label: "Other", icon: "📦" },
];

const CICD_OPTIONS = [
  { id: "github_actions", label: "GitHub Actions", icon: "🐙" },
  { id: "gitlab_ci", label: "GitLab CI/CD", icon: "🦊" },
  { id: "jenkins", label: "Jenkins", icon: "🔧" },
  { id: "circleci", label: "CircleCI", icon: "🔵" },
  { id: "travis", label: "Travis CI", icon: "🔨" },
  { id: "azure_pipelines", label: "Azure Pipelines", icon: "☁️" },
  { id: "aws_codepipeline", label: "AWS CodePipeline", icon: "☁️" },
  { id: "gcp_cloudbuild", label: "GCP Cloud Build", icon: "☁️" },
  { id: "bitbucket_pipelines", label: "Bitbucket Pipelines", icon: "🪣" },
  { id: "drone", label: "Drone CI", icon: "🐝" },
  { id: "tekton", label: "Tekton", icon: "🔧" },
  { id: "argocd", label: "ArgoCD", icon: "🐙" },
  { id: "fluxcd", label: "FluxCD", icon: "🔄" },
  { id: "concourse", label: "Concourse", icon: "✈️" },
  { id: "buildkite", label: "Buildkite", icon: "🔨" },
  { id: "semaphore", label: "Semaphore", icon: "🚦" },
  { id: "harness", label: "Harness", icon: "🏗️" },
  { id: "spinnaker", label: "Spinnaker", icon: "🎡" },
  { id: "woodpecker", label: "Woodpecker", icon: "🐦" },
  { id: "none", label: "None / Manual", icon: "🔧" },
];

const DEPLOYMENT_TARGETS = [
  // Major Cloud Providers
  { id: "aws", label: "AWS", icon: "☁️" },
  { id: "gcp", label: "Google Cloud", icon: "☁️" },
  { id: "azure", label: "Microsoft Azure", icon: "☁️" },
  // Kubernetes Platforms
  { id: "kubernetes", label: "Kubernetes (self-hosted)", icon: "☸️" },
  { id: "eks", label: "AWS EKS", icon: "☸️" },
  { id: "gke", label: "GCP GKE", icon: "☸️" },
  { id: "aks", label: "Azure AKS", icon: "☸️" },
  { id: "openshift", label: "OpenShift", icon: "🎩" },
  { id: "rancher", label: "Rancher", icon: "🐄" },
  // PaaS & Serverless
  { id: "vercel", label: "Vercel", icon: "▲" },
  { id: "netlify", label: "Netlify", icon: "🌐" },
  { id: "heroku", label: "Heroku", icon: "🟣" },
  { id: "railway", label: "Railway", icon: "🚂" },
  { id: "render", label: "Render", icon: "🔷" },
  { id: "flyio", label: "Fly.io", icon: "🪁" },
  { id: "cloudflare", label: "Cloudflare", icon: "☁️" },
  // VPS & Bare Metal
  { id: "digitalocean", label: "DigitalOcean", icon: "🌊" },
  { id: "linode", label: "Linode/Akamai", icon: "🖥️" },
  { id: "vultr", label: "Vultr", icon: "🖥️" },
  { id: "hetzner", label: "Hetzner", icon: "🖥️" },
  { id: "ovh", label: "OVH", icon: "🖥️" },
  { id: "scaleway", label: "Scaleway", icon: "🖥️" },
  { id: "upcloud", label: "UpCloud", icon: "🖥️" },
  { id: "baremetal", label: "Bare Metal / On-Prem", icon: "🏠" },
  // Serverless Functions
  { id: "lambda", label: "AWS Lambda", icon: "λ" },
  { id: "cloud_functions", label: "GCP Cloud Functions", icon: "λ" },
  { id: "azure_functions", label: "Azure Functions", icon: "λ" },
  { id: "cloudflare_workers", label: "Cloudflare Workers", icon: "⚡" },
  { id: "deno_deploy", label: "Deno Deploy", icon: "🦕" },
  // Edge
  { id: "edge", label: "Edge (CDN)", icon: "🌐" },
];

const CONTAINER_REGISTRIES = [
  { id: "dockerhub", label: "Docker Hub", icon: "🐳" },
  { id: "ghcr", label: "GitHub Container Registry", icon: "🐙" },
  { id: "ecr", label: "AWS ECR", icon: "☁️" },
  { id: "gcr", label: "Google Container Registry", icon: "☁️" },
  { id: "gar", label: "Google Artifact Registry", icon: "☁️" },
  { id: "acr", label: "Azure Container Registry", icon: "☁️" },
  { id: "quay", label: "Quay.io", icon: "📦" },
  { id: "harbor", label: "Harbor", icon: "⚓" },
  { id: "gitlab_registry", label: "GitLab Container Registry", icon: "🦊" },
  { id: "jfrog", label: "JFrog Artifactory", icon: "🐸" },
  { id: "nexus", label: "Sonatype Nexus", icon: "📦" },
  { id: "custom", label: "Custom / Self-hosted", icon: "🏠" },
];

function StepRepository({
  config,
  onChange,
}: {
  config: WizardConfig;
  onChange: (updates: Partial<WizardConfig>) => void;
}) {
  const toggleRepoHost = (hostId: string) => {
    const currentHosts = config.repoHosts || [];
    const isSelected = currentHosts.includes(hostId);
    
    if (isSelected) {
      // Deselect
      const newHosts = currentHosts.filter((h) => h !== hostId);
      onChange({ 
        repoHosts: newHosts,
        repoHost: newHosts[0] || "github" // Keep single host for backward compat
      });
    } else {
      // Select
      const newHosts = [...currentHosts, hostId];
      
      // Auto-select CI/CD based on repo host, but only if current CI/CD is the default
      // Don't override if user already selected something different
      let cicdUpdate: Partial<WizardConfig> = {};
      const defaultCiCd = "github_actions";
      if (config.cicd === defaultCiCd || config.cicd === "gitlab_ci") {
        if (hostId === "github" && !newHosts.includes("gitlab")) {
          cicdUpdate = { cicd: "github_actions" };
        } else if (hostId === "gitlab" && !newHosts.includes("github")) {
          cicdUpdate = { cicd: "gitlab_ci" };
        }
      }
      
      onChange({ 
        repoHosts: newHosts,
        repoHost: newHosts[0], // Keep single host for backward compat
        ...cicdUpdate
      });
    }
  };
  
  const selectedHosts = config.repoHosts?.length ? config.repoHosts : (config.repoHost ? [config.repoHost] : []);
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Repository Setup</h2>
      <p className="mt-2 text-muted-foreground">
        Configure host, visibility, and repo preferences.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium">Repository Host(s)</label>
          <p className="text-xs text-muted-foreground mt-1">Select one or more platforms where this code will be hosted</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPO_HOSTS.map((host) => (
              <button
                key={host.id}
                onClick={() => toggleRepoHost(host.id)}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-all ${
                  selectedHosts.includes(host.id) ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <span>{host.icon}</span>
                <span>{host.label}</span>
              </button>
            ))}
          </div>
          {selectedHosts.includes("other") && (
            <div className="mt-3">
              <input
                type="text"
                value={config.repoHostOther || ""}
                onChange={(e) => onChange({ repoHostOther: e.target.value })}
                placeholder="e.g., Forgejo, Gogs, Azure DevOps..."
                className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          {selectedHosts.length >= 2 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <label className="text-sm font-medium text-amber-800 dark:text-amber-200">Why multiple repositories?</label>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Help the AI understand how you use each platform</p>
              <input
                type="text"
                value={config.multiRepoReason || ""}
                onChange={(e) => onChange({ multiRepoReason: e.target.value })}
                placeholder="e.g., GitHub for code, Gitea for deployment"
                className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <ToggleOption
            label="Make repository public"
            description="Public repos unlock funding and sharing."
            checked={config.isPublic}
            onChange={(v) => onChange({ isPublic: v })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">License (preference)</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { id: "mit", label: "MIT" },
              { id: "apache-2.0", label: "Apache 2.0" },
              { id: "gpl-3.0", label: "GPL 3.0" },
              { id: "lgpl-3.0", label: "LGPL 3.0" },
              { id: "agpl-3.0", label: "AGPL 3.0" },
              { id: "bsd-2", label: "BSD 2-Clause" },
              { id: "bsd-3", label: "BSD 3-Clause" },
              { id: "mpl-2.0", label: "MPL 2.0" },
              { id: "isc", label: "ISC" },
              { id: "unlicense", label: "Unlicense" },
              { id: "cc0", label: "CC0" },
              { id: "none", label: "None" },
              { id: "other", label: "Other" },
            ].map((license) => (
              <button
                key={license.id}
                onClick={() => onChange({ license: license.id })}
                className={`rounded-md border px-3 py-2 text-sm transition-all ${
                  config.license === license.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {license.label}
              </button>
            ))}
          </div>
          {config.license === "other" && (
            <input
              type="text"
              value={config.licenseOther || ""}
              onChange={(e) => onChange({ licenseOther: e.target.value })}
              placeholder="e.g., Proprietary, WTFPL, CC BY 4.0..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          {config.license && config.license !== "none" && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Additional license notes (optional)</label>
              <input
                type="text"
                value={config.licenseNotes || ""}
                onChange={(e) => onChange({ licenseNotes: e.target.value })}
                placeholder="e.g., I want to avoid commercial usage, Include copyright notice in files..."
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={config.staticFiles.licenseSave}
              onChange={(e) =>
                onChange({
                  staticFiles: { ...config.staticFiles, licenseSave: e.target.checked },
                  licenseSave: e.target.checked,
                })
              }
            />
            Save as default license preference
          </label>
        </div>

        <div>
          <label className="text-sm font-medium">Example Repository (optional)</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide a public repo similar to this project to guide AI on style and structure.
          </p>
          <input
            type="text"
            value={config.exampleRepoUrl || ""}
            onChange={(e) => onChange({ exampleRepoUrl: e.target.value })}
            placeholder="e.g., https://github.com/org/example"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium">External Documentation (optional)</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Link to Confluence, Notion, GitBook, or internal wiki for additional context.
          </p>
          <input
            type="text"
            value={config.documentationUrl || ""}
            onChange={(e) => onChange({ documentationUrl: e.target.value })}
            placeholder="e.g., https://company.atlassian.net/wiki/spaces/PROJECT"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-3">
          <ToggleOption
            label="Conventional Commits"
            description="Use standardized commit messages"
            checked={config.conventionalCommits}
            onChange={(v) => onChange({ conventionalCommits: v })}
          />
          <ToggleOption
            label="Semantic Versioning"
            description="Follow semver for releases"
            checked={config.semver}
            onChange={(v) => onChange({ semver: v })}
          />
          {(config.repoHost === "github" || config.repoHost === "gitlab") && (
            <ToggleOption
              label="Dependabot / Updates"
              description="Enable dependency updates (GitHub & GitLab only)"
              checked={config.dependabot}
              onChange={(v) => onChange({ dependabot: v })}
            />
          )}
        </div>

        {/* CI/CD Selection */}
        <div>
          <label className="block text-sm font-medium">CI/CD Platform</label>
          <p className="text-xs text-muted-foreground mb-2">Select your continuous integration/deployment tool</p>
          <div className="flex flex-wrap gap-2">
            {CICD_OPTIONS.slice(0, 8).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ cicd: opt.id })}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.cicd === opt.id ? "border-primary bg-primary/10" : "hover:border-primary"
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">Show more CI/CD options...</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {CICD_OPTIONS.slice(8).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChange({ cicd: opt.id })}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    config.cicd === opt.id ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </details>
        </div>

        {/* Deployment Targets */}
        <div>
          <label className="block text-sm font-medium">Deployment Targets</label>
          <p className="text-xs text-muted-foreground mb-2">Where will this project be deployed? (select all that apply)</p>
          <div className="flex flex-wrap gap-2">
            {DEPLOYMENT_TARGETS.slice(0, 12).map((target) => (
              <button
                key={target.id}
                onClick={() => {
                  const exists = config.deploymentTargets.includes(target.id);
                  onChange({ 
                    deploymentTargets: exists 
                      ? config.deploymentTargets.filter(t => t !== target.id)
                      : [...config.deploymentTargets, target.id]
                  });
                }}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.deploymentTargets.includes(target.id) ? "border-primary bg-primary/10" : "hover:border-primary"
                }`}
              >
                <span>{target.icon}</span>
                <span>{target.label}</span>
                {config.deploymentTargets.includes(target.id) && <span>✓</span>}
              </button>
            ))}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">Show more deployment targets...</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEPLOYMENT_TARGETS.slice(12).map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    const exists = config.deploymentTargets.includes(target.id);
                    onChange({ 
                      deploymentTargets: exists 
                        ? config.deploymentTargets.filter(t => t !== target.id)
                        : [...config.deploymentTargets, target.id]
                    });
                  }}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    config.deploymentTargets.includes(target.id) ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  <span>{target.icon}</span>
                  <span>{target.label}</span>
                  {config.deploymentTargets.includes(target.id) && <span>✓</span>}
                </button>
              ))}
            </div>
          </details>
        </div>

        {/* Container Build Options */}
        <ToggleOption
          label="Build container image"
          description="Plan to build Docker images in this repo"
          checked={config.buildContainer}
          onChange={(v) => onChange({ buildContainer: v })}
        />

        {/* Container Registry Selection - shown if buildContainer is true */}
        {config.buildContainer && (
          <div className="ml-4 border-l-2 border-primary/30 pl-4">
            <label className="block text-sm font-medium">Container Registry</label>
            <p className="text-xs text-muted-foreground mb-2">Where will you push your container images?</p>
            <div className="flex flex-wrap gap-2">
              {CONTAINER_REGISTRIES.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => onChange({ containerRegistry: reg.id })}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all ${
                    config.containerRegistry === reg.id ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  <span>{reg.icon}</span>
                  <span>{reg.label}</span>
                </button>
              ))}
            </div>
            {config.containerRegistry === "custom" && (
              <input
                type="text"
                value={config.containerRegistryOther}
                onChange={(e) => onChange({ containerRegistryOther: e.target.value })}
                placeholder="e.g., registry.example.com"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function StepAIBehavior({
  selected,
  onToggle,
  importantFiles,
  importantFilesOther,
  onImportantFilesToggle,
  onImportantFilesOtherChange,
  enableAutoUpdate,
  onAutoUpdateChange,
  includePersonalData,
  onIncludePersonalDataChange,
  userPersona,
  userSkillLevel,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  importantFiles: string[];
  importantFilesOther: string;
  onImportantFilesToggle: (v: string) => void;
  onImportantFilesOtherChange: (v: string) => void;
  enableAutoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
  includePersonalData: boolean;
  onIncludePersonalDataChange: (v: boolean) => void;
  userPersona?: string | null;
  userSkillLevel?: string | null;
}) {
  const personaLabel = userPersona ? userPersona.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Not set";
  const skillLabel = userSkillLevel ? userSkillLevel.replace(/\b\w/g, c => c.toUpperCase()) : "Not set";
  
  return (
    <div>
      <h2 className="text-2xl font-bold">AI Behavior Rules</h2>
      <p className="mt-2 text-muted-foreground">
        Define how AI assistants should behave when helping you code.
      </p>
      
      {/* Personal Data Section */}
      <div className="mt-6 rounded-lg border-2 border-blue-600 bg-white p-4 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-blue-200">Include Your Profile in Blueprint</h3>
            <p className="mt-1 text-sm text-gray-700 dark:text-blue-300">
              Your developer role (<strong>{personaLabel}</strong>) and skill level (<strong>{skillLabel}</strong>) 
              can be included in the generated config file. This helps the AI tailor its responses to your experience level.
            </p>
            <p className="mt-2 text-xs text-gray-600 dark:text-blue-400 italic">
              Note: This information is only used in the downloaded config file — it doesn&apos;t affect the wizard itself.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                id="includePersonalData"
                checked={includePersonalData}
                onChange={(e) => onIncludePersonalDataChange(e.target.checked)}
                className="h-4 w-4 rounded border-blue-600 accent-blue-600"
              />
              <label htmlFor="includePersonalData" className="text-sm font-medium text-gray-800 dark:text-blue-200">
                Include my role &amp; skill level in the AI config file
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {AI_BEHAVIOR_RULES.map((rule) => (
          <button
            key={rule.id}
            onClick={() => onToggle(rule.id)}
            className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all ${
              selected.includes(rule.id)
                ? "border-primary bg-primary/5"
                : "hover:border-primary"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                selected.includes(rule.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground"
              }`}
            >
              {selected.includes(rule.id) && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.label}</span>
                {rule.recommended && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {rule.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Self-Improving Blueprint Option */}
      <div className="mt-3">
        <button
          onClick={() => onAutoUpdateChange(!enableAutoUpdate)}
          className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all ${
            enableAutoUpdate
              ? "border-primary bg-primary/5"
              : "hover:border-primary"
          }`}
        >
          <div
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
              enableAutoUpdate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground"
            }`}
          >
            {enableAutoUpdate && <Check className="h-3 w-3" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold">
              Enable Self-Improving Blueprint
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              Include an instruction for AI agents to track your coding patterns and automatically
              update this configuration file as you work. The AI will learn from your preferences
              and improve the rules over time.
            </p>
          </div>
        </button>
      </div>

      {/* Important Files to Read First */}
      <div className="mt-8">
        <h3 className="font-semibold">Important Files to Read First</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select files the AI should read to understand your project context. These are typically documentation, configuration, or architecture files.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {IMPORTANT_FILES.map((file) => (
            <button
              key={file.id}
              onClick={() => onImportantFilesToggle(file.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                importantFiles.includes(file.id)
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary"
              }`}
            >
              <span>{file.icon}</span>
              <span>{file.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Other important files (comma-separated)</label>
          <input
            type="text"
            value={importantFilesOther}
            onChange={(e) => onImportantFilesOtherChange(e.target.value)}
            placeholder="e.g., src/config/index.ts, docs/api.md, prisma/schema.prisma"
            className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

const COMMON_COMMANDS = [
  // Build commands - JavaScript/Node
  { cmd: "npm run build", category: "build" },
  { cmd: "pnpm build", category: "build" },
  { cmd: "yarn build", category: "build" },
  { cmd: "bun run build", category: "build" },
  { cmd: "next build", category: "build" },
  { cmd: "vite build", category: "build" },
  { cmd: "tsc", category: "build" },
  { cmd: "tsc --noEmit", category: "build" },
  { cmd: "esbuild", category: "build" },
  { cmd: "rollup -c", category: "build" },
  { cmd: "webpack", category: "build" },
  { cmd: "parcel build", category: "build" },
  // Build - Python
  { cmd: "python setup.py build", category: "build" },
  { cmd: "pip install -e .", category: "build" },
  { cmd: "poetry build", category: "build" },
  { cmd: "pdm build", category: "build" },
  { cmd: "hatch build", category: "build" },
  // Build - Go
  { cmd: "go build", category: "build" },
  { cmd: "go build ./...", category: "build" },
  { cmd: "go install", category: "build" },
  // Build - Rust
  { cmd: "cargo build", category: "build" },
  { cmd: "cargo build --release", category: "build" },
  // Build - Java/JVM
  { cmd: "mvn package", category: "build" },
  { cmd: "mvn clean install", category: "build" },
  { cmd: "gradle build", category: "build" },
  { cmd: "./gradlew build", category: "build" },
  // Build - .NET
  { cmd: "dotnet build", category: "build" },
  { cmd: "dotnet publish", category: "build" },
  // Build - Containers
  { cmd: "docker build -t app .", category: "build" },
  { cmd: "docker compose build", category: "build" },
  { cmd: "podman build -t app .", category: "build" },
  { cmd: "buildah bud -t app .", category: "build" },
  // Build - IaC
  { cmd: "terraform init", category: "build" },
  { cmd: "terraform plan", category: "build" },
  { cmd: "terragrunt run-all plan", category: "build" },
  { cmd: "pulumi preview", category: "build" },
  { cmd: "cdk synth", category: "build" },
  { cmd: "helm package .", category: "build" },
  
  // Test commands - JavaScript
  { cmd: "npm test", category: "test" },
  { cmd: "pnpm test", category: "test" },
  { cmd: "yarn test", category: "test" },
  { cmd: "bun test", category: "test" },
  { cmd: "npm test -- --coverage", category: "test" },
  { cmd: "vitest", category: "test" },
  { cmd: "vitest run", category: "test" },
  { cmd: "vitest --coverage", category: "test" },
  { cmd: "jest", category: "test" },
  { cmd: "jest --coverage", category: "test" },
  { cmd: "mocha", category: "test" },
  { cmd: "ava", category: "test" },
  // Test - E2E
  { cmd: "playwright test", category: "test" },
  { cmd: "cypress run", category: "test" },
  { cmd: "cypress open", category: "test" },
  { cmd: "puppeteer", category: "test" },
  // Test - Python
  { cmd: "pytest", category: "test" },
  { cmd: "pytest --cov", category: "test" },
  { cmd: "pytest -v", category: "test" },
  { cmd: "python -m unittest", category: "test" },
  { cmd: "tox", category: "test" },
  { cmd: "nox", category: "test" },
  // Test - Go
  { cmd: "go test ./...", category: "test" },
  { cmd: "go test -v ./...", category: "test" },
  { cmd: "go test -cover ./...", category: "test" },
  // Test - Rust
  { cmd: "cargo test", category: "test" },
  { cmd: "cargo test --all", category: "test" },
  // Test - Java
  { cmd: "mvn test", category: "test" },
  { cmd: "gradle test", category: "test" },
  { cmd: "./gradlew test", category: "test" },
  // Test - .NET
  { cmd: "dotnet test", category: "test" },
  // Test - Infrastructure
  { cmd: "terratest", category: "test" },
  { cmd: "conftest test", category: "test" },
  { cmd: "inspec exec", category: "test" },
  { cmd: "molecule test", category: "test" },
  { cmd: "kitchen test", category: "test" },
  { cmd: "helm unittest", category: "test" },
  // Test - Load/Performance
  { cmd: "k6 run", category: "test" },
  { cmd: "locust", category: "test" },
  { cmd: "artillery run", category: "test" },
  
  // Lint commands - JavaScript
  { cmd: "npm run lint", category: "lint" },
  { cmd: "eslint .", category: "lint" },
  { cmd: "eslint . --fix", category: "lint" },
  { cmd: "next lint", category: "lint" },
  { cmd: "prettier --check .", category: "lint" },
  { cmd: "prettier --write .", category: "lint" },
  { cmd: "biome check", category: "lint" },
  { cmd: "oxlint", category: "lint" },
  // Lint - Python
  { cmd: "ruff check .", category: "lint" },
  { cmd: "ruff format .", category: "lint" },
  { cmd: "black --check .", category: "lint" },
  { cmd: "flake8", category: "lint" },
  { cmd: "pylint", category: "lint" },
  { cmd: "mypy .", category: "lint" },
  { cmd: "pyright", category: "lint" },
  // Lint - Go
  { cmd: "go fmt ./...", category: "lint" },
  { cmd: "golangci-lint run", category: "lint" },
  { cmd: "go vet ./...", category: "lint" },
  // Lint - Rust
  { cmd: "cargo fmt --check", category: "lint" },
  { cmd: "cargo clippy", category: "lint" },
  // Lint - Shell
  { cmd: "shellcheck *.sh", category: "lint" },
  // Lint - IaC
  { cmd: "terraform fmt -check", category: "lint" },
  { cmd: "terraform validate", category: "lint" },
  { cmd: "tflint", category: "lint" },
  { cmd: "checkov", category: "lint" },
  { cmd: "trivy config .", category: "lint" },
  { cmd: "ansible-lint", category: "lint" },
  { cmd: "yamllint .", category: "lint" },
  { cmd: "helm lint", category: "lint" },
  { cmd: "kubeval", category: "lint" },
  { cmd: "kubeconform", category: "lint" },
  // Lint - Docker
  { cmd: "hadolint Dockerfile", category: "lint" },
  { cmd: "dockle", category: "lint" },
  
  // Dev commands
  { cmd: "npm run dev", category: "dev" },
  { cmd: "pnpm dev", category: "dev" },
  { cmd: "yarn dev", category: "dev" },
  { cmd: "bun dev", category: "dev" },
  { cmd: "next dev", category: "dev" },
  { cmd: "next dev --turbo", category: "dev" },
  { cmd: "vite", category: "dev" },
  { cmd: "vite dev", category: "dev" },
  { cmd: "nuxt dev", category: "dev" },
  { cmd: "remix dev", category: "dev" },
  { cmd: "astro dev", category: "dev" },
  // Dev - Python
  { cmd: "python app.py", category: "dev" },
  { cmd: "flask run", category: "dev" },
  { cmd: "uvicorn main:app --reload", category: "dev" },
  { cmd: "python manage.py runserver", category: "dev" },
  // Dev - Go
  { cmd: "go run .", category: "dev" },
  { cmd: "air", category: "dev" },
  // Dev - Rust
  { cmd: "cargo run", category: "dev" },
  { cmd: "cargo watch -x run", category: "dev" },
  // Dev - Containers
  { cmd: "docker compose up", category: "dev" },
  { cmd: "docker compose up -d", category: "dev" },
  { cmd: "docker compose watch", category: "dev" },
  { cmd: "podman-compose up", category: "dev" },
  // Dev - Kubernetes
  { cmd: "kubectl port-forward", category: "dev" },
  { cmd: "skaffold dev", category: "dev" },
  { cmd: "tilt up", category: "dev" },
  { cmd: "telepresence connect", category: "dev" },
  
  // Other/Misc commands
  { cmd: "npm run storybook", category: "other" },
  { cmd: "prisma db push", category: "other" },
  { cmd: "prisma generate", category: "other" },
  { cmd: "prisma migrate dev", category: "other" },
  { cmd: "drizzle-kit push", category: "other" },
  { cmd: "npm run typecheck", category: "other" },
  { cmd: "npm run format", category: "other" },
  { cmd: "pre-commit run --all-files", category: "other" },
  // Deploy
  { cmd: "terraform apply", category: "other" },
  { cmd: "pulumi up", category: "other" },
  { cmd: "cdk deploy", category: "other" },
  { cmd: "ansible-playbook", category: "other" },
  { cmd: "helm install", category: "other" },
  { cmd: "helm upgrade --install", category: "other" },
  { cmd: "kubectl apply -f", category: "other" },
  { cmd: "argocd app sync", category: "other" },
  { cmd: "flux reconcile", category: "other" },
  // Clean
  { cmd: "npm run clean", category: "other" },
  { cmd: "rm -rf node_modules", category: "other" },
  { cmd: "docker system prune", category: "other" },
  { cmd: "go clean -cache", category: "other" },
  { cmd: "cargo clean", category: "other" },
];

function StepCommands({
  config,
  onChange,
}: {
  config: CommandsConfig;
  onChange: (updates: Partial<CommandsConfig>) => void;
}) {
  const [searches, setSearches] = useState<Record<string, string>>({ build: "", test: "", lint: "", dev: "", other: "" });
  const [newCommand, setNewCommand] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["build", "test", "lint", "dev"]);
  
  const allSelected = [
    ...(config.build ? [config.build] : []),
    ...(config.test ? [config.test] : []),
    ...(config.lint ? [config.lint] : []),
    ...(config.dev ? [config.dev] : []),
    ...config.additional,
  ];
  
  const toggleCommand = (cmd: string, category: string) => {
    if (category === "build") {
      onChange({ build: config.build === cmd ? "" : cmd });
    } else if (category === "test") {
      onChange({ test: config.test === cmd ? "" : cmd });
    } else if (category === "lint") {
      onChange({ lint: config.lint === cmd ? "" : cmd });
    } else if (category === "dev") {
      onChange({ dev: config.dev === cmd ? "" : cmd });
    } else {
      const exists = config.additional.includes(cmd);
      onChange({ additional: exists ? config.additional.filter(c => c !== cmd) : [...config.additional, cmd] });
    }
  };
  
  const isSelected = (cmd: string) => allSelected.includes(cmd);
  
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };
  
  const categories = [
    { id: "build", label: "Build", desc: "Compile / bundle" },
    { id: "test", label: "Test", desc: "Run tests" },
    { id: "lint", label: "Lint", desc: "Check code quality" },
    { id: "dev", label: "Dev", desc: "Development server" },
    { id: "other", label: "Other", desc: "Deploy, clean, etc." },
  ] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold">Commands</h2>
      <p className="mt-2 text-muted-foreground">
        Select your project commands for each category. Each has its own search.
      </p>

      <div className="mt-4 space-y-3">
        {categories.map(cat => {
          const catCmds = COMMON_COMMANDS.filter(c => c.category === cat.id);
          const search = searches[cat.id] || "";
          const filteredCmds = catCmds.filter(c => 
            c.cmd.toLowerCase().includes(search.toLowerCase())
          );
          const isExpanded = expandedCategories.includes(cat.id);
          const selectedInCat = cat.id === "build" ? config.build 
            : cat.id === "test" ? config.test 
            : cat.id === "lint" ? config.lint 
            : cat.id === "dev" ? config.dev 
            : null;
          
          return (
            <div key={cat.id} className="rounded-lg border overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.desc}</span>
                  {selectedInCat && (
                    <code className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{selectedInCat}</code>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {isExpanded && (
                <div className="p-3 border-t">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearches(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder={`Search ${cat.label.toLowerCase()} commands...`}
                      className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {filteredCmds.slice(0, 20).map(c => (
                      <button
                        key={c.cmd}
                        onClick={() => toggleCommand(c.cmd, c.category)}
                        className={`rounded-full border px-3 py-1 text-xs font-mono transition-all ${
                          isSelected(c.cmd) ? "border-primary bg-primary/10 text-primary" : "hover:border-primary"
                        }`}
                      >
                        {c.cmd}
                      </button>
                    ))}
                    {filteredCmds.length > 20 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{filteredCmds.length - 20} more (use search)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-lg border p-3">
          <label className="text-sm font-medium">Add custom command</label>
          <div className="mt-2 flex gap-2">
            <input
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="e.g., npm run migrate"
              className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCommand.trim()) {
                  onChange({ additional: [...config.additional, newCommand.trim()] });
                  setNewCommand("");
                }
              }}
            />
            <Button
              variant="secondary"
              disabled={!newCommand.trim()}
              onClick={() => {
                onChange({ additional: [...config.additional, newCommand.trim()] });
                setNewCommand("");
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {config.additional.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Custom commands:</p>
            <div className="flex flex-wrap gap-2">
              {config.additional.map((c, idx) => (
                <button
                  key={`${c}-${idx}`}
                  onClick={() => onChange({ additional: config.additional.filter((_, i) => i !== idx) })}
                  className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary hover:bg-red-100 hover:text-red-600"
                  title="Click to remove"
                >
                  {c} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save these commands as defaults
        </label>
      </div>
    </div>
  );
}

function StepCodeStyle({
  config,
  onChange,
  selectedLanguages,
}: {
  config: CodeStyleConfig;
  onChange: (updates: Partial<CodeStyleConfig>) => void;
  selectedLanguages: string[];
}) {
  const namingOptions = [
    { id: "language_default", label: "Follow language conventions", desc: "Use idiomatic style for selected language(s)" },
    { id: "camelCase", label: "camelCase", desc: "JavaScript, TypeScript, Java" },
    { id: "snake_case", label: "snake_case", desc: "Python, Ruby, Rust, Go" },
    { id: "PascalCase", label: "PascalCase", desc: "C#, .NET classes" },
    { id: "kebab-case", label: "kebab-case", desc: "CSS, HTML attributes, URLs" },
  ];

  // Get language-specific hints
  const getLanguageHint = () => {
    if (selectedLanguages.length === 0) return null;
    const hints: Record<string, string> = {
      python: "Python typically uses snake_case for functions/variables, PascalCase for classes",
      typescript: "TypeScript typically uses camelCase for variables, PascalCase for types/interfaces",
      javascript: "JavaScript typically uses camelCase for variables, PascalCase for classes",
      go: "Go uses camelCase for private, PascalCase for exported",
      rust: "Rust uses snake_case for functions/variables, PascalCase for types",
      java: "Java uses camelCase for methods/variables, PascalCase for classes",
      csharp: "C# uses PascalCase for public members, camelCase with _ prefix for private",
      ruby: "Ruby uses snake_case for methods/variables, PascalCase for classes",
      php: "PHP uses camelCase or snake_case depending on framework (PSR-12 recommends camelCase)",
      kotlin: "Kotlin uses camelCase for functions/variables, PascalCase for classes",
    };
    for (const lang of selectedLanguages) {
      if (hints[lang]) return hints[lang];
    }
    return null;
  };

  const languageHint = getLanguageHint();

  return (
    <div>
      <h2 className="text-2xl font-bold">Code Style</h2>
      <p className="mt-2 text-muted-foreground">
        Capture naming and style conventions to guide AI output.
      </p>

      {selectedLanguages.length === 0 && (
        <div className="mt-4 rounded-lg border-2 border-amber-500 bg-white p-3 shadow-sm dark:border-yellow-500/50 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-yellow-200">
            ⚠️ No languages selected. Go back to the Tech Stack step to select at least one language, 
            or enable "Let AI decide" for best results.
          </p>
        </div>
      )}

      {languageHint && (
        <div className="mt-4 rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm dark:border-blue-500/50 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            💡 {languageHint}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Naming convention</label>
          <div className="mt-2 space-y-2">
            {namingOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ naming: opt.id })}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  config.naming === opt.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  config.naming === opt.id ? "border-primary bg-primary text-white" : "border-muted-foreground"
                }`}>
                  {config.naming === opt.id && <Check className="h-3 w-3" />}
                </div>
                <div>
                  <span className="font-medium">{opt.label}</span>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Handling Pattern */}
        <div>
          <label className="text-sm font-medium">Error Handling Pattern (optional)</label>
          <p className="mt-1 text-xs text-muted-foreground">How should errors be handled in this project? Click again to deselect.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ERROR_HANDLING_PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => onChange({ errorHandling: config.errorHandling === pattern.id ? "" : pattern.id })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.errorHandling === pattern.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
          {config.errorHandling === "other" && (
            <input
              type="text"
              value={config.errorHandlingOther}
              onChange={(e) => onChange({ errorHandlingOther: e.target.value })}
              placeholder="e.g., Domain-specific errors, Monad-based, Custom error classes..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {/* Logging Conventions */}
        <div>
          <label className="text-sm font-medium">Logging Conventions (optional)</label>
          <p className="mt-1 text-xs text-muted-foreground">How should logging be handled? Click again to deselect.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { id: "structured_json", label: "Structured JSON" },
              { id: "console_log", label: "Console.log (dev)" },
              { id: "log_levels", label: "Log Levels (debug/info/warn/error)" },
              { id: "pino", label: "Pino" },
              { id: "winston", label: "Winston" },
              { id: "bunyan", label: "Bunyan" },
              { id: "python_logging", label: "Python logging" },
              { id: "log4j", label: "Log4j / SLF4J" },
              { id: "serilog", label: "Serilog" },
              { id: "opentelemetry", label: "OpenTelemetry" },
              { id: "other", label: "Other" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onChange({ loggingConventions: config.loggingConventions === option.id ? "" : option.id })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  config.loggingConventions === option.id
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {config.loggingConventions === "other" && (
            <input
              type="text"
              value={config.loggingConventionsOther || ""}
              onChange={(e) => onChange({ loggingConventionsOther: e.target.value })}
              placeholder="e.g., Custom logger, file-based logging, centralized logging service..."
              className="mt-2 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Additional style notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g., prefer named exports, keep functions pure, avoid default exports, max line length 100..."
            rows={4}
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save as default code style
        </label>
      </div>
    </div>
  );
}

const BOUNDARY_OPTIONS = [
  // File operations
  "Delete files",
  "Create new files",
  "Rename/move files",
  // Code changes
  "Rewrite large sections",
  "Refactor architecture",
  "Change dependencies",
  "Modify database schema",
  "Update API contracts",
  // Infrastructure
  "Touch CI pipelines",
  "Modify Docker config",
  "Change environment vars",
  // Documentation
  "Update docs automatically",
  "Edit README",
  "Modify comments",
  // Security
  "Handle secrets/credentials",
  "Modify auth logic",
  // Testing
  "Delete failing tests",
  "Skip tests temporarily",
];

function StepBoundaries({
  config,
  onChange,
}: {
  config: BoundariesConfig;
  onChange: (updates: Partial<BoundariesConfig>) => void;
}) {
  const toggle = (bucket: "always" | "ask" | "never", value: string) => {
    const current = config[bucket];
    if (!current) return;
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [bucket]: updated } as any);
  };

  // Get options already selected in other buckets
  const getUsedOptions = (excludeBucket: "always" | "ask" | "never") => {
    const used = new Set<string>();
    if (excludeBucket !== "always") config.always?.forEach(o => used.add(o));
    if (excludeBucket !== "ask") config.ask?.forEach(o => used.add(o));
    if (excludeBucket !== "never") config.never?.forEach(o => used.add(o));
    return used;
  };

  const renderBucket = (title: string, bucket: "always" | "ask" | "never", description: string) => {
    const usedInOther = getUsedOptions(bucket);
    const availableOptions = BOUNDARY_OPTIONS.filter(opt => !usedInOther.has(opt));
    const selectedInBucket = config[bucket] || [];
    
    return (
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableOptions.length === 0 && selectedInBucket.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">All options assigned to other categories</p>
          ) : (
            <>
              {/* Show selected items first */}
              {selectedInBucket.map((opt) => (
                <button
                  key={`${bucket}-${opt}`}
                  onClick={() => toggle(bucket, opt)}
                  className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs"
                >
                  {opt} ✓
                </button>
              ))}
              {/* Show available unselected items */}
              {availableOptions.filter(opt => !selectedInBucket.includes(opt)).map((opt) => (
                <button
                  key={`${bucket}-${opt}`}
                  onClick={() => toggle(bucket, opt)}
                  className="rounded-full border px-3 py-1 text-xs hover:border-primary"
                >
                  {opt}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Boundaries</h2>
      <p className="mt-2 text-muted-foreground">Define what AI should always do, ask first, or never do. Each option can only be in one category.</p>
      <div className="mt-4 space-y-3">
        {renderBucket("Always do", "always", "AI will do these automatically")}
        {renderBucket("Ask first", "ask", "AI will ask before doing")}
        {renderBucket("Never do", "never", "AI will refuse to do")}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={config.savePreferences}
          onChange={(e) => onChange({ savePreferences: e.target.checked })}
        />
        Save boundaries as defaults in my profile
      </label>
    </div>
  );
}

const TEST_FRAMEWORKS = [
  // JavaScript/TypeScript
  "jest", "vitest", "mocha", "ava", "tap", "bun:test",
  // E2E/Integration
  "playwright", "cypress", "puppeteer", "selenium", "webdriverio", "testcafe",
  // React/Frontend
  "rtl", "enzyme", "storybook", "chromatic",
  // API/Mocking
  "msw", "supertest", "pact", "dredd", "karate", "postman", "insomnia",
  // Python
  "pytest", "unittest", "nose2", "hypothesis", "behave", "robot",
  // Go
  "go-test", "testify", "ginkgo", "gomega",
  // Java/JVM
  "junit", "testng", "mockito", "spock", "cucumber-jvm",
  // Ruby
  "rspec", "minitest", "capybara", "factory_bot",
  // .NET
  "xunit", "nunit", "mstest", "specflow",
  // Infrastructure/DevOps
  "terratest", "conftest", "opa", "inspec", "serverspec", "molecule", "kitchen", "goss",
  // Kubernetes
  "kubetest", "kuttl", "chainsaw", "helm-unittest",
  // Security
  "owasp-zap", "burpsuite", "nuclei", "semgrep",
  // Load/Performance
  "k6", "locust", "jmeter", "artillery", "gatling", "vegeta", "wrk", "ab",
  // Chaos Engineering
  "chaos-mesh", "litmus", "gremlin", "toxiproxy",
  // Contract Testing
  "pact", "spring-cloud-contract", "specmatic",
  // BDD
  "cucumber", "behave", "gauge", "concordion",
  // Mutation Testing
  "stryker", "pitest", "mutmut",
  // Fuzzing
  "go-fuzz", "afl", "libfuzzer", "jazzer",
];

const TEST_LEVELS = [
  { id: "smoke", label: "Smoke", desc: "Quick sanity checks" },
  { id: "unit", label: "Unit", desc: "Individual functions/components" },
  { id: "integration", label: "Integration", desc: "Component interactions" },
  { id: "e2e", label: "E2E", desc: "Full user flows" },
];

function StepTesting({
  config,
  onChange,
}: {
  config: TestingStrategyConfig;
  onChange: (updates: Partial<TestingStrategyConfig>) => void;
}) {
  const [search, setSearch] = useState("");
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  
  const filtered = TEST_FRAMEWORKS.filter((f) => f.toLowerCase().includes(search.toLowerCase()));
  // Show selected frameworks first, then others - limit to 16 initially
  const sortedFiltered = useMemo(() => {
    const selected = filtered.filter(fw => config.frameworks.includes(fw));
    const unselected = filtered.filter(fw => !config.frameworks.includes(fw));
    return [...selected, ...unselected];
  }, [filtered, config.frameworks]);
  
  const visibleFrameworks = showAllFrameworks ? sortedFiltered : sortedFiltered.slice(0, 16);
  const hasMoreFrameworks = sortedFiltered.length > 16 && !showAllFrameworks;
  
  const toggleLevel = (lvl: string) => {
    const exists = config.levels.includes(lvl);
    onChange({
      levels: exists ? config.levels.filter((l) => l !== lvl) : [...config.levels, lvl],
    });
  };
  
  const toggleFramework = (fw: string) => {
    const exists = config.frameworks.includes(fw);
    onChange({
      frameworks: exists ? config.frameworks.filter((f) => f !== fw) : [...config.frameworks, fw],
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Testing Strategy</h2>
      <p className="mt-2 text-muted-foreground">Document how tests should run and what good coverage looks like.</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Test Levels (select all that apply)</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TEST_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => toggleLevel(lvl.id)}
                className={`flex flex-col items-start rounded-md border p-3 text-left text-sm transition-all ${
                  config.levels.includes(lvl.id) ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{lvl.label}</span>
                  {config.levels.includes(lvl.id) && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{lvl.desc}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="coverage-target">
              Coverage target
            </label>
            <span className="text-lg font-bold text-primary">{config.coverage}%</span>
          </div>
          <input
            id="coverage-target"
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.coverage}
            onChange={(e) => onChange({ coverage: parseInt(e.target.value, 10) })}
            className="mt-2 w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Frameworks</label>
          <div className="relative mb-2 mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAllFrameworks(true); }}
              placeholder="Search testing frameworks..."
              className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <div className="flex flex-wrap gap-2">
              {visibleFrameworks.map((fw) => (
                <button
                  key={fw}
                  onClick={() => toggleFramework(fw)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    config.frameworks.includes(fw) ? "border-primary bg-primary/10" : "hover:border-primary"
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
            
            {/* Blur overlay and Load More button */}
            {hasMoreFrameworks && (
              <div className="relative mt-2">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <button
                  onClick={() => setShowAllFrameworks(true)}
                  className="w-full rounded-md border border-dashed border-muted-foreground/30 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Show {sortedFiltered.length - 16} more frameworks...
                </button>
              </div>
            )}
            
            {showAllFrameworks && sortedFiltered.length > 16 && (
              <button
                onClick={() => setShowAllFrameworks(false)}
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="e.g., run e2e on main only, use msw for network mocking"
            className="mt-1 w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save testing defaults to profile
        </label>
      </div>
    </div>
  );
}

function StaticFileEditor({
  label,
  description,
  enabled,
  onEnable,
  content,
  onContentChange,
  saveChecked,
  onSaveToggle,
  placeholder,
  minHeight = "150px",
}: {
  label: string;
  description: string;
  enabled: boolean;
  onEnable: (v: boolean) => void;
  content?: string;
  onContentChange?: (v: string) => void;
  saveChecked: boolean;
  onSaveToggle: (v: boolean) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onEnable(!enabled)}
          className="flex items-center gap-3 text-left"
        >
          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
            enabled ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
          }`}>
            {enabled && <Check className="h-3 w-3" />}
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={saveChecked}
            onChange={(e) => onSaveToggle(e.target.checked)}
          />
          Save to profile
        </label>
      </div>
      {enabled && onContentChange && (
        <div className="mt-3">
          <CodeEditor
            value={content || ""}
            onChange={onContentChange}
            placeholder={placeholder}
            minHeight={minHeight}
          />
        </div>
      )}
    </div>
  );
}

function StepStaticFiles({
  config,
  isGithub,
  isPublic,
  buildContainer,
  onChange,
}: {
  config: StaticFilesConfig;
  isGithub: boolean;
  isPublic: boolean;
  buildContainer: boolean;
  onChange: (updates: Partial<StaticFilesConfig>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Static Files</h2>
      <p className="mt-2 text-muted-foreground">
        Enable files to embed in your AI config.
      </p>

      <div className="mt-4 space-y-3">
        <StaticFileEditor
          label=".editorconfig"
          description="Consistent indentation and line endings"
          enabled={config.editorconfig}
          onEnable={(v) => onChange({ editorconfig: v })}
          content={config.editorconfigCustom}
          onContentChange={(v) => onChange({ editorconfigCustom: v })}
          saveChecked={config.editorconfigSave}
          onSaveToggle={(v) => onChange({ editorconfigSave: v })}
          placeholder={`root = true

[*]
indent_style = space
indent_size = 2`}
        />
        
        <StaticFileEditor
          label="CONTRIBUTING.md"
          description="Guidelines for contributors"
          enabled={config.contributing}
          onEnable={(v) => onChange({ contributing: v })}
          content={config.contributingCustom}
          onContentChange={(v) => onChange({ contributingCustom: v })}
          saveChecked={config.contributingSave}
          onSaveToggle={(v) => onChange({ contributingSave: v })}
          placeholder={`# Contributing

Thank you for your interest in contributing!`}
          minHeight="180px"
        />
        
        <StaticFileEditor
          label="CODE_OF_CONDUCT.md"
          description="Community expectations"
          enabled={config.codeOfConduct}
          onEnable={(v) => onChange({ codeOfConduct: v })}
          content={config.codeOfConductCustom}
          onContentChange={(v) => onChange({ codeOfConductCustom: v })}
          saveChecked={config.codeOfConductSave}
          onSaveToggle={(v) => onChange({ codeOfConductSave: v })}
          placeholder={`# Code of Conduct

We are committed to providing a welcoming environment.`}
          minHeight="180px"
        />
        
        <StaticFileEditor
          label="SECURITY.md"
          description="How to report vulnerabilities"
          enabled={config.security}
          onEnable={(v) => onChange({ security: v })}
          content={config.securityCustom}
          onContentChange={(v) => onChange({ securityCustom: v })}
          saveChecked={config.securitySave}
          onSaveToggle={(v) => onChange({ securitySave: v })}
          placeholder={`# Security Policy

To report a vulnerability, please email security@example.com`}
          minHeight="150px"
        />
        
        <StaticFileEditor
          label="ROADMAP.md"
          description="Project roadmap and planned features"
          enabled={config.roadmap}
          onEnable={(v) => onChange({ roadmap: v })}
          content={config.roadmapCustom}
          onContentChange={(v) => onChange({ roadmapCustom: v })}
          saveChecked={config.roadmapSave}
          onSaveToggle={(v) => onChange({ roadmapSave: v })}
          placeholder={`# Roadmap

## Planned Features
- [ ] Feature 1
- [ ] Feature 2

## Future Ideas
- Idea 1
- Idea 2`}
          minHeight="180px"
        />

        {isGithub && isPublic && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onChange({ funding: !config.funding })}
                className="flex items-center gap-3 text-left"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                  config.funding ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                }`}>
                  {config.funding && <Check className="h-3 w-3" />}
                </div>
                <div>
                  <p className="font-medium">FUNDING.yml</p>
                  <p className="text-xs text-muted-foreground">GitHub Sponsors & donation links</p>
                </div>
              </button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={config.fundingSave}
                  onChange={(e) => onChange({ fundingSave: e.target.checked })}
                />
                Save to profile
              </label>
            </div>
            {config.funding && (
              <div className="mt-3">
                <CodeEditor
                  value={config.fundingYml || ""}
                  onChange={(v) => onChange({ fundingYml: v })}
                  placeholder={`github: [your-username]
patreon: your-patreon
ko_fi: your-kofi`}
                  minHeight="100px"
                />
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">.gitignore</p>
              <p className="text-xs text-muted-foreground">Generate or provide a custom one</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.gitignoreSave}
                onChange={(e) => onChange({ gitignoreSave: e.target.checked })}
              />
              Save to profile
            </label>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["generate", "custom", "skip"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ gitignoreMode: opt })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.gitignoreMode === opt ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt === "generate" ? "AI generate" : opt === "custom" ? "Custom" : "Skip"}
              </button>
            ))}
          </div>
          {config.gitignoreMode === "custom" && (
            <div className="mt-2">
              <CodeEditor
                value={config.gitignoreCustom || ""}
                onChange={(v) => onChange({ gitignoreCustom: v })}
                placeholder={`node_modules/
.env
dist/`}
                minHeight="120px"
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">.dockerignore</p>
              <p className="text-xs text-muted-foreground">
                {buildContainer ? "Recommended for container builds" : "Exclude files from Docker context"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.dockerignoreSave}
                onChange={(e) => onChange({ dockerignoreSave: e.target.checked })}
              />
              Save to profile
            </label>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["generate", "custom", "skip"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ dockerignoreMode: opt })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.dockerignoreMode === opt ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt === "generate" ? "AI generate" : opt === "custom" ? "Custom" : "Skip"}
              </button>
            ))}
          </div>
          {config.dockerignoreMode === "custom" && (
            <div className="mt-2">
              <CodeEditor
                value={config.dockerignoreCustom || ""}
                onChange={(v) => onChange({ dockerignoreCustom: v })}
                placeholder={`node_modules/
.git/
*.log`}
                minHeight="120px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepFeedback({
  value,
  onChange,
  userTier,
}: {
  value: string;
  onChange: (v: string) => void;
  userTier: string;
}) {
  const isMaxUser = userTier === "max";
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Anything we&apos;ve missed?</h2>
      <p className="mt-2 text-muted-foreground">
        Is there something specific you&apos;d like the AI to know about your
        project that we haven&apos;t asked? Add any additional context.
      </p>

      {/* AI Assist Panel - MAX users only */}
      {isMaxUser && (
        <div className="mt-6 rounded-lg border border-purple-200 bg-white p-4 shadow-sm dark:border-purple-800 dark:bg-purple-900/20">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </div>
          <AiEditPanel
            currentContent={value}
            onContentChange={onChange}
            mode="wizard"
            placeholder="Describe what you need, e.g., 'I want strict TypeScript, no any types'"
            showReplaceWarning={!!value.trim()}
          />
        </div>
      )}

      <div className="mt-6">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="E.g., 'This project uses a monorepo setup with Turborepo', 'We follow a specific naming convention for components'..."
          className="min-h-[200px] w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">💡 Suggestions:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Special deployment requirements or procedures</li>
          <li>• Team-specific workflows or conventions</li>
        </ul>
        
        <h4 className="mt-4 font-medium">⚠️ Known Issues / Gotchas:</h4>
        <p className="mt-1 text-xs text-muted-foreground">Document quirks so AI doesn&apos;t repeat mistakes:</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Platform-specific bugs or workarounds</li>
          <li>• &quot;If you see X error, do Y instead&quot;</li>
          <li>• Dependencies that need special handling</li>
          <li>• Things AI assistants commonly get wrong in this project</li>
        </ul>
        
        <h4 className="mt-4 font-medium">🔑 Things You Might Not Have Thought Of:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Environment variable naming patterns</li>
          <li>• Database migration procedures</li>
          <li>• Performance constraints or SLAs</li>
          <li>• Security requirements (auth flow, data handling)</li>
        </ul>
      </div>
    </div>
  );
}

function StepGenerate({
  config,
  session,
  previewFiles,
  expandedFile,
  copiedFile,
  blueprintMode,
  enableApiSync,
  userTier,
  onToggleExpand,
  onCopyFile,
  onPlatformChange,
  onApiSyncChange,
}: {
  config: WizardConfig;
  session: {
    user: {
      displayName?: string | null;
      name?: string | null;
      persona?: string | null;
      skillLevel?: string | null;
    };
  };
  previewFiles: GeneratedFile[];
  expandedFile: string | null;
  copiedFile: string | null;
  blueprintMode: boolean;
  enableApiSync: boolean;
  userTier: string;
  onToggleExpand: (fileName: string) => void;
  onCopyFile: (fileName: string, content: string) => void;
  onPlatformChange: (v: string) => void;
  onApiSyncChange: (v: boolean) => void;
}) {
  const [ideSearch, setIdeSearch] = useState("");
  const [showAllIdes, setShowAllIdes] = useState(false);
  
  const filteredPlatforms = useMemo(() => {
    const searchLower = ideSearch.toLowerCase();
    return PLATFORMS.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.note.toLowerCase().includes(searchLower)
    );
  }, [ideSearch]);
  
  const visiblePlatforms = showAllIdes ? filteredPlatforms : filteredPlatforms.slice(0, 4);
  const hasMore = filteredPlatforms.length > 4 && !showAllIdes;
  
  return (
    <div>
      <h2 className="text-2xl font-bold">Preview & Download</h2>
      <p className="mt-2 text-muted-foreground">
        Preview your generated files for{" "}
        <strong>{config.projectName || "your project"}</strong>. Click to expand
        and copy individual files.
      </p>

      {/* Blueprint Mode Notice */}
      {blueprintMode && (
        <div className="mt-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧩</span>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Blueprint Template Mode Active</h4>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your configuration includes <code className="rounded bg-amber-200 px-1 py-0.5 font-mono text-xs dark:bg-amber-800">[[VARIABLE|default]]</code> placeholders 
                (highlighted in amber) that others can customize when using this template.
              </p>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <strong>Preview:</strong> Shows variable placeholders • <strong>Download:</strong> Replaces variables with their default values so the file works immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {/* Target AI IDE Selection */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium">Target AI IDE</h3>
          <p className="text-sm text-muted-foreground">Choose your AI IDE (files are optimized for it but remain portable).</p>
          
          {/* Search box */}
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={ideSearch}
              onChange={(e) => { setIdeSearch(e.target.value); setShowAllIdes(true); }}
              placeholder="Search AI IDEs..."
              className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visiblePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPlatformChange(p.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-3 text-sm transition-all ${
                    config.platform === p.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:border-primary"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.note}</span>
                </button>
              ))}
            </div>
            
            {/* Blur overlay and Load More button */}
            {hasMore && (
              <div className="relative mt-2">
                <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                <button
                  onClick={() => setShowAllIdes(true)}
                  className="w-full rounded-md border border-dashed border-muted-foreground/30 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Show {filteredPlatforms.length - 4} more IDEs...
                </button>
              </div>
            )}
            
            {showAllIdes && filteredPlatforms.length > 4 && (
              <button
                onClick={() => setShowAllIdes(false)}
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        </div>

        {/* Profile info used */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium">Using your profile settings:</h3>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>Author: {session.user.displayName || session.user.name || "User"}</span>
            <span>•</span>
            <span className="capitalize">{session.user.persona || "Developer"}</span>
            <span>•</span>
            <span className="capitalize">{session.user.skillLevel || "Intermediate"} level</span>
          </div>
        </div>

        {/* API Sync Option - Pro+ only */}
        {["pro", "max", "teams"].includes(userTier.toLowerCase()) && (
          <div className={`rounded-lg border p-4 transition-colors ${enableApiSync ? "border-primary bg-primary/5" : "border-dashed"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    PRO
                  </span>
                  <label className="font-medium">
                    🔄 Auto-update via API
                  </label>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save as private blueprint &amp; include sync commands in the downloaded file.
                </p>
                {enableApiSync && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Requires an API token.{" "}
                    <a href="/settings" target="_blank" className="text-primary hover:underline">
                      Get one in Settings →
                    </a>
                  </p>
                )}
              </div>
              <button
                onClick={() => onApiSyncChange(!enableApiSync)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enableApiSync ? "bg-primary" : "bg-muted"}`}
                aria-label="Toggle API sync"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enableApiSync ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
        )}

        {/* File Previews */}
        <div className="space-y-2">
          <h3 className="font-medium">
            Generated Files ({previewFiles.length}):
          </h3>
          {previewFiles.length === 0 ? (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Generating preview... If this persists, try going back and selecting options.
              </p>
            </div>
          ) : null}
          {previewFiles.map((file) => (
            <div
              key={file.fileName}
              className="overflow-hidden rounded-lg border"
            >
              {/* File Header */}
              <button
                onClick={() => onToggleExpand(file.fileName)}
                className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-left hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{file.fileName}</span>
                  {file.platform && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {PLATFORMS.find((p) => p.id === file.platform)?.name ||
                        file.platform}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyFile(file.fileName, file.content);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-background"
                  >
                    {copiedFile === file.fileName ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {expandedFile === file.fileName ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* File Content Preview */}
              {expandedFile === file.fileName && (
                <div className="border-t bg-background">
                  <pre className="max-h-64 overflow-auto p-4 text-xs font-mono">
                    <code 
                      dangerouslySetInnerHTML={{
                        __html: file.content
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")
                          .replace(
                            /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|([^\]]*))?\]\]/g,
                            '<mark class="bg-amber-300 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded px-0.5 font-semibold">$&</mark>'
                          )
                      }}
                    />
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Tech Stack:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-600"
                >
                  {LANGUAGES.find((l) => l.value === lang)?.label || lang}
                </span>
              ))}
              {config.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-600"
                >
                  {FRAMEWORKS.find((f) => f.value === fw)?.label || fw}
                </span>
              ))}
              {config.databases.map((db) => (
                <span
                  key={db}
                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600"
                >
                  🗄️ {DATABASES.find((d) => d.value === db)?.label || db.replace("custom:", "")}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">AI Behavior:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.aiBehaviorRules.slice(0, 3).map((rule) => (
                <span
                  key={rule}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  {AI_BEHAVIOR_RULES.find((r) => r.id === rule)?.label}
                </span>
              ))}
              {config.aiBehaviorRules.length > 3 && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  +{config.aiBehaviorRules.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${
        checked ? "border-primary bg-primary/5" : "hover:border-primary"
      }`}
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-green-500" : "bg-muted"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-400 dark:bg-gray-600"
          }`}
        />
      </div>
    </button>
  );
}

function ToggleWithSave({
  label,
  description,
  checked,
  saveChecked,
  onToggle,
  onSaveToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  saveChecked: boolean;
  onToggle: (v: boolean) => void;
  onSaveToggle: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={saveChecked} onChange={(e) => onSaveToggle(e.target.checked)} />
          Save
        </label>
      </div>
      <div className="mt-3">
        <ToggleOption
          label={`Include ${label}`}
          description=""
          checked={checked}
          onChange={onToggle}
        />
      </div>
    </div>
  );
}

// Login Required Gate Component
function LoginRequired() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Sign in to continue</h1>
          <p className="mt-3 text-muted-foreground">
            Create an account or sign in to start building your AI IDE
            configurations.
          </p>

          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/signin?callbackUrl=/wizard">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Profile Setup Required Component
function ProfileSetupRequired() {
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Set profile as completed with defaults
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Developer",
          persona: "fullstack",
          skillLevel: "intermediate",
          skipped: true,
        }),
      });
      // Reload to continue with wizard
      window.location.reload();
    } catch {
      setSkipping(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Settings className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Personalize Your Experience</h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about yourself to get better AI configurations.
            <strong className="block mt-2 text-foreground">This is optional — you can skip it!</strong>
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/settings?tab=profile&onboarding=true">
                <Settings className="mr-2 h-5 w-5" />
                Set Up Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
            </Button>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 text-left">
            <h3 className="font-semibold">Why set up your profile?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your persona (e.g., &quot;DevOps Engineer&quot;) is <strong>dynamically added</strong> to 
              every blueprint you download. This helps AI assistants understand your background 
              and tailor responses accordingly.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Display name</strong> — Your nickname or name (doesn&apos;t have to be real)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Developer type</strong> — Backend, Frontend, DevOps, Data, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Skill level</strong> — Controls how verbose AI explanations are</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              🔒 This info is only used to personalize your downloads. We don&apos;t share it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
