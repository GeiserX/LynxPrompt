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
  // Additional ORMs
  { id: "typeorm", label: "TypeORM", icon: "📦" },
  { id: "sequelize", label: "Sequelize", icon: "📦" },
  { id: "mongoose", label: "Mongoose", icon: "🍃" },
  { id: "sqlalchemy", label: "SQLAlchemy", icon: "🐍" },
  // DevOps/Infra - Containers
  { id: "docker", label: "Docker", icon: "🐳" },
  { id: "podman", label: "Podman", icon: "🦭" },
  { id: "containerd", label: "containerd", icon: "📦" },
  { id: "buildah", label: "Buildah", icon: "🔨" },
  // Kubernetes & Orchestration
  { id: "kubernetes", label: "Kubernetes", icon: "☸️" },
  { id: "helm", label: "Helm", icon: "⎈" },
  { id: "kustomize", label: "Kustomize", icon: "📋" },
  { id: "kubebuilder", label: "Kubebuilder", icon: "🔧" },
  { id: "operatorsdk", label: "Operator SDK", icon: "⚙️" },
  { id: "crossplane", label: "Crossplane", icon: "🔀" },
  { id: "k3s", label: "K3s", icon: "☸️" },
  { id: "kind", label: "Kind", icon: "📦" },
  { id: "minikube", label: "Minikube", icon: "💻" },
  { id: "rancher", label: "Rancher", icon: "🐄" },
  { id: "openshift", label: "OpenShift", icon: "🎩" },
  // IaC - Infrastructure as Code
  { id: "terraform", label: "Terraform", icon: "🏗️" },
  { id: "terragrunt", label: "Terragrunt", icon: "🏗️" },
  { id: "opentofu", label: "OpenTofu", icon: "🏗️" },
  { id: "pulumi", label: "Pulumi", icon: "☁️" },
  { id: "cdktf", label: "CDK for Terraform", icon: "🏗️" },
  { id: "awscdk", label: "AWS CDK", icon: "☁️" },
  { id: "cloudformation", label: "CloudFormation", icon: "☁️" },
  { id: "bicep", label: "Bicep (Azure)", icon: "💪" },
  { id: "arm", label: "ARM Templates", icon: "☁️" },
  // Configuration Management
  { id: "ansible", label: "Ansible", icon: "🔧" },
  { id: "chef", label: "Chef", icon: "👨‍🍳" },
  { id: "puppet", label: "Puppet", icon: "🎭" },
  { id: "saltstack", label: "SaltStack", icon: "🧂" },
  // GitOps
  { id: "argocd", label: "ArgoCD", icon: "🐙" },
  { id: "fluxcd", label: "FluxCD", icon: "🔄" },
  { id: "jenkinsx", label: "Jenkins X", icon: "🔧" },
  // Service Mesh & Networking
  { id: "istio", label: "Istio", icon: "🕸️" },
  { id: "linkerd", label: "Linkerd", icon: "🔗" },
  { id: "consul", label: "Consul", icon: "🔍" },
  { id: "envoy", label: "Envoy", icon: "📬" },
  { id: "nginx", label: "NGINX", icon: "🌐" },
  { id: "traefik", label: "Traefik", icon: "🚦" },
  { id: "caddy", label: "Caddy", icon: "🔒" },
  { id: "haproxy", label: "HAProxy", icon: "⚖️" },
  // Observability & Monitoring
  { id: "prometheus", label: "Prometheus", icon: "📊" },
  { id: "grafana", label: "Grafana", icon: "📈" },
  { id: "datadog", label: "Datadog", icon: "🐕" },
  { id: "newrelic", label: "New Relic", icon: "📊" },
  { id: "opentelemetry", label: "OpenTelemetry", icon: "🔭" },
  { id: "jaeger", label: "Jaeger", icon: "🔍" },
  { id: "zipkin", label: "Zipkin", icon: "🔍" },
  { id: "elk", label: "ELK Stack", icon: "📋" },
  { id: "loki", label: "Loki", icon: "📝" },
  { id: "fluentd", label: "Fluentd", icon: "📤" },
  { id: "fluentbit", label: "Fluent Bit", icon: "📤" },
  { id: "vector", label: "Vector", icon: "➡️" },
  // Secrets & Security
  { id: "vault", label: "HashiCorp Vault", icon: "🔐" },
  { id: "sops", label: "SOPS", icon: "🔒" },
  { id: "externalsecrets", label: "External Secrets", icon: "🔑" },
  { id: "sealedsecrets", label: "Sealed Secrets", icon: "📦" },
  { id: "trivy", label: "Trivy", icon: "🛡️" },
  { id: "snyk", label: "Snyk", icon: "🔍" },
  { id: "falco", label: "Falco", icon: "🦅" },
  { id: "opa", label: "Open Policy Agent", icon: "🛡️" },
  { id: "kyverno", label: "Kyverno", icon: "🛡️" },
  // CI/CD Tools
  { id: "jenkins", label: "Jenkins", icon: "🔧" },
  { id: "tekton", label: "Tekton", icon: "🔧" },
  { id: "drone", label: "Drone CI", icon: "🐝" },
  { id: "concourse", label: "Concourse", icon: "✈️" },
  { id: "spinnaker", label: "Spinnaker", icon: "🎡" },
  // Message Queues
  { id: "kafka", label: "Apache Kafka", icon: "📨" },
  { id: "rabbitmq", label: "RabbitMQ", icon: "🐰" },
  { id: "nats", label: "NATS", icon: "📬" },
  { id: "pulsar", label: "Apache Pulsar", icon: "⭐" },
  { id: "sqs", label: "AWS SQS", icon: "📬" },
  // ML/AI Ops
  { id: "mlflow", label: "MLflow", icon: "🧪" },
  { id: "kubeflow", label: "Kubeflow", icon: "☸️" },
  { id: "airflow", label: "Apache Airflow", icon: "🌬️" },
  { id: "dagster", label: "Dagster", icon: "📊" },
  { id: "prefect", label: "Prefect", icon: "🔄" },
  { id: "ray", label: "Ray", icon: "☀️" },
  // Serverless
  { id: "serverless", label: "Serverless Framework", icon: "⚡" },
  { id: "sam", label: "AWS SAM", icon: "☁️" },
  { id: "openfaas", label: "OpenFaaS", icon: "λ" },
  { id: "knative", label: "Knative", icon: "☸️" },
  // State Management
  { id: "redux", label: "Redux", icon: "🔄" },
  { id: "zustand", label: "Zustand", icon: "🐻" },
  { id: "tanstack", label: "TanStack Query", icon: "🔮" },
  // Additional UI
  { id: "mui", label: "Material UI", icon: "🎨" },
  { id: "antdesign", label: "Ant Design", icon: "🐜" },
];

/**
 * Get framework IDs for filtering
 */
export const FRAMEWORK_IDS = FRAMEWORKS.map(f => f.id);

