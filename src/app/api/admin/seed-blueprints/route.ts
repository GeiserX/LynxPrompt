import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// Sample blueprints for testing - including real, substantial content
const SAMPLE_BLUEPRINTS = [
  // FREE Blueprint 1: Comprehensive Next.js Full-Stack
  {
    name: "Next.js 15 Full-Stack Production Blueprint",
    description: "A comprehensive AGENTS.md for modern Next.js applications with App Router, Server Components, authentication, database patterns, and deployment best practices.",
    type: "CURSORRULES" as const,
    content: `# Next.js 15 Full-Stack Production Blueprint

## 🎯 Project Overview

This is a production-ready Next.js application using the App Router, Server Components, and modern React patterns.

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15.x | App Router, Server Components |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Zustand | Client state |
| TanStack Query | Server state |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | API endpoints |
| Prisma ORM | Database access |
| NextAuth.js 4.x | Authentication |
| Zod | Validation |

### Database
| Database | Purpose |
|----------|---------|
| PostgreSQL | Primary data store |
| Redis | Caching, sessions |

---

## 📁 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   └── [resource]/   # REST-style routes
│   ├── (auth)/           # Auth route group (login, signup)
│   ├── (dashboard)/      # Protected dashboard routes
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   └── layouts/           # Layout components
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # NextAuth config
│   ├── utils.ts           # Utilities
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
\`\`\`

---

## 🔐 Authentication Patterns

### NextAuth.js Configuration

\`\`\`typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // OAuth providers
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Email/Magic Link
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id, role: user.role },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
\`\`\`

### Protected API Routes

\`\`\`typescript
// Always check authentication in API routes
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
\`\`\`

### Protected Pages

\`\`\`typescript
// Use middleware for route protection
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
\`\`\`

---

## 🗄️ Database Patterns

### Prisma Client

\`\`\`typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
\`\`\`

### Schema Best Practices

\`\`\`prisma
// Always include these fields
model User {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Soft delete pattern
  deletedAt DateTime?
  
  // Relations
  posts     Post[]
  
  @@index([email])
}
\`\`\`

---

## 🎨 Component Patterns

### Server Components (Default)

\`\`\`tsx
// app/posts/page.tsx
import { prisma } from "@/lib/db";

export default async function PostsPage() {
  // Direct database access in Server Components
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
\`\`\`

### Client Components

\`\`\`tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function SearchPosts() {
  const [query, setQuery] = useState("");
  
  const { data, isLoading } = useQuery({
    queryKey: ["posts", query],
    queryFn: () => fetch(\`/api/posts?q=\${query}\`).then(r => r.json()),
    enabled: query.length > 2,
  });

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isLoading ? <Spinner /> : <PostList posts={data} />}
    </div>
  );
}
\`\`\`

---

## 📝 Form Handling

### Server Actions

\`\`\`tsx
// actions/posts.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const createPostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
});

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const data = createPostSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  await prisma.post.create({
    data: { ...data, authorId: session.user.id },
  });

  revalidatePath("/posts");
}
\`\`\`

---

## 🔒 Security Patterns

### Input Validation

\`\`\`typescript
// Always validate with Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// In API routes
const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
\`\`\`

### CSRF Protection

- NextAuth.js handles CSRF for auth routes
- Use \`sameSite: "lax"\` for cookies
- Validate \`callbackUrl\` - only relative paths or same-origin

### Rate Limiting

\`\`\`typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
}
\`\`\`

---

## 🚀 Deployment

### Environment Variables

\`\`\`bash
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://yourapp.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth
GITHUB_ID="..."
GITHUB_SECRET="..."
\`\`\`

### Docker Build

\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

---

## 🧪 Testing

### Unit Tests

\`\`\`typescript
// __tests__/utils.test.ts
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    expect(formatDate(new Date("2024-01-01"))).toBe("January 1, 2024");
  });
});
\`\`\`

### Integration Tests

\`\`\`typescript
// __tests__/api/posts.test.ts
import { createMocks } from "node-mocks-http";
import handler from "@/app/api/posts/route";

describe("POST /api/posts", () => {
  it("creates a post", async () => {
    const { req, res } = createMocks({ method: "POST" });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(201);
  });
});
\`\`\`

---

## 🤖 AI Instructions

### Code Style
- Use TypeScript strict mode
- Prefer \`interface\` over \`type\` for object shapes
- Use named exports for components
- Follow Next.js file conventions

### When Generating Code
- Always check for existing patterns in the codebase
- Use Server Components by default
- Add loading.tsx and error.tsx for each route
- Include proper TypeScript types

### Security
- Never expose secrets in client code
- Validate all user input
- Use parameterized queries (Prisma handles this)
- Implement proper error handling without leaking details

### Performance
- Use dynamic imports for heavy components
- Implement proper caching strategies
- Use ISR where appropriate
- Optimize images with next/image

---

*This blueprint provides a solid foundation for production Next.js applications.*
`,
    tier: "ADVANCED" as const,
    tags: ["nextjs", "react", "typescript", "fullstack", "production", "authentication", "prisma"],
    category: "Full Stack",
    difficulty: "intermediate",
    price: null, // FREE
  },
  // FREE Blueprint 2: DevOps & Infrastructure
  {
    name: "DevOps Infrastructure Blueprint",
    description: "Complete DevOps setup with Docker, CI/CD pipelines, Kubernetes deployment, monitoring, and infrastructure as code patterns for modern cloud applications.",
    type: "CLAUDE_MD" as const,
    content: `# DevOps Infrastructure Blueprint

## 🎯 Overview

This blueprint provides comprehensive DevOps patterns for containerized applications with CI/CD, monitoring, and infrastructure as code.

---

## 🐳 Docker Patterns

### Multi-Stage Build

\`\`\`dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
\`\`\`

### Docker Compose for Development

\`\`\`yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - ./src:/app/src  # Hot reload in dev
    
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
\`\`\`

---

## 🔄 CI/CD Pipelines

### GitHub Actions

\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=semver,pattern={{version}}
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          namespace: production
          manifests: |
            k8s/deployment.yaml
            k8s/service.yaml
          images: |
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
\`\`\`

---

## ☸️ Kubernetes Deployment

### Deployment Manifest

\`\`\`yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: ghcr.io/myorg/myapp:latest
          ports:
            - containerPort: 3000
          
          # Resource limits
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          
          # Health checks
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          
          # Environment from secrets/configmaps
          envFrom:
            - configMapRef:
                name: myapp-config
            - secretRef:
                name: myapp-secrets
      
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
\`\`\`

### Horizontal Pod Autoscaler

\`\`\`yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
\`\`\`

---

## 📊 Monitoring & Observability

### Prometheus Metrics

\`\`\`typescript
// metrics.ts
import { Registry, Counter, Histogram } from "prom-client";

export const registry = new Registry();

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

// Middleware to track metrics
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
    httpRequestDuration.observe(
      { method: req.method, path: req.path },
      duration
    );
  });
  
  next();
}
\`\`\`

### Grafana Dashboard (JSON)

\`\`\`json
{
  "dashboard": {
    "title": "Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ]
      }
    ]
  }
}
\`\`\`

---

## 🏗️ Infrastructure as Code

### Terraform for AWS

\`\`\`hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "myapp-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-west-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "myapp-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "myapp"
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  cluster_name    = "myapp-cluster"
  cluster_version = "1.29"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 10
      desired_size = 3
      
      instance_types = ["t3.medium"]
    }
  }
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"
  
  identifier = "myapp-db"
  
  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.t3.medium"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  
  db_name  = "myapp"
  username = "myapp_admin"
  port     = 5432
  
  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.security_group.security_group_id]
  
  backup_retention_period = 7
  skip_final_snapshot     = false
  deletion_protection     = true
}
\`\`\`

---

## 🔒 Security Best Practices

### Secrets Management

\`\`\`yaml
# Use external secrets operator with AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: myapp-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: myapp/production
        property: database_url
    - secretKey: API_KEY
      remoteRef:
        key: myapp/production
        property: api_key
\`\`\`

### Network Policies

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
\`\`\`

---

## 🤖 AI Instructions

### When Working on DevOps

- Always use multi-stage Docker builds
- Implement proper health checks
- Use Kubernetes resources limits
- Follow GitOps principles
- Encrypt secrets at rest and in transit

### Security First

- Never hardcode secrets
- Use least privilege principles
- Implement network policies
- Enable audit logging
- Regular security scanning (Trivy, Snyk)

### Monitoring

- Every service needs metrics
- Use structured logging (JSON)
- Implement distributed tracing
- Set up proper alerting
- Monitor SLIs/SLOs

---

*This blueprint provides production-ready DevOps patterns for cloud-native applications.*
`,
    tier: "ADVANCED" as const,
    tags: ["devops", "docker", "kubernetes", "cicd", "terraform", "aws", "monitoring", "infrastructure"],
    category: "DevOps",
    difficulty: "advanced",
    price: null, // FREE
  },
  // PAID Blueprint: LynxPrompt AGENTS.md (sanitized)
  {
    name: "SaaS Platform Builder Blueprint",
    description: "The exact AGENTS.md used to build LynxPrompt. A comprehensive blueprint for building production SaaS applications with Next.js, authentication, payments, dual databases, and deployment automation. Learn from real production code.",
    type: "CURSORRULES" as const,
    content: `# SaaS Platform Builder Blueprint

## 🎯 Project Overview

This blueprint guides AI agents in building production-ready SaaS applications. It's the actual configuration used to build a real SaaS platform with 10,000+ lines of code.

**Features covered:**
- Next.js 15 with App Router
- Dual PostgreSQL databases
- Stripe payments & subscriptions
- Multi-provider authentication
- Docker deployment with GitOps
- Self-hosted analytics

---

## 👤 Communication Style

### Guidelines for AI Assistants

- **Be direct and efficient** - Don't over-explain or add unnecessary caveats
- **Do the work, don't ask permission** - If the task is clear, execute it
- **Always deploy to production** - After any code changes, build and deploy immediately
- **Use exact values when provided** - Don't modify user-provided values

### Things To Do ✅

- Clean, readable code without over-engineering
- Proper GDPR/EU legal compliance
- Self-hosted solutions (analytics, Docker registry)
- Privacy-focused approaches (cookieless analytics)
- Semver versioning for Docker images
- TypeScript with strict types
- Tailwind CSS for styling

### Things To Avoid ❌

- Over-engineering or unnecessary abstractions
- Adding features not explicitly requested
- Verbose explanations when action is needed
- Third-party analytics/tracking services
- Breaking changes without communication
- Using \`:latest\` tags for Docker images
- Creating unnecessary documentation files

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15.x | App Router, Server Components |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Zustand | Client state |
| TanStack Query | Server state |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | API endpoints |
| Prisma ORM | Database access |
| NextAuth.js 4.x | Authentication |
| Zod | Validation |

### Databases
| Database | Purpose | Client |
|----------|---------|--------|
| PostgreSQL (app) | Application data | \`@prisma/client-app\` |
| PostgreSQL (users) | Users, sessions | \`@prisma/client-users\` |

### Infrastructure
| Component | Details |
|-----------|---------|
| Docker | Multi-stage builds |
| Portainer | Container management with GitOps |
| Self-hosted registry | Private Docker images |
| Umami | Self-hosted analytics (EU, cookieless) |

### Payments & Billing
| Component | Details |
|-----------|---------|
| Stripe | Payment processing, subscriptions |
| Stripe Customer Portal | Self-service billing |
| Stripe Webhooks | Subscription lifecycle |

---

## 🗄️ Dual Database Architecture

This project uses **two separate PostgreSQL databases** with distinct Prisma clients:

\`\`\`typescript
// System/application data (templates, platforms)
import { prismaApp } from "@/lib/db-app";

// User data (users, sessions, passkeys, user templates)
import { prismaUsers } from "@/lib/db-users";
\`\`\`

**Schema files:**
- \`prisma/schema-app.prisma\` → generates \`@prisma/client-app\`
- \`prisma/schema-users.prisma\` → generates \`@prisma/client-users\`

**Commands:**
\`\`\`bash
npm run db:generate    # Generate both Prisma clients
npm run db:push        # Push schema changes to both databases
npm run db:seed        # Seed both databases
\`\`\`

### Why Dual Databases?

1. **Security isolation** - User PII separate from application data
2. **Scaling flexibility** - Scale databases independently
3. **Compliance** - Easier GDPR data deletion
4. **Backup strategies** - Different retention policies

---

## 🔐 Authentication

### Providers
- GitHub OAuth
- Google OAuth
- Magic Link (email)
- Passkeys (WebAuthn)

### User Roles
- \`USER\` - Default role
- \`ADMIN\` - Administrative access
- \`SUPERADMIN\` - Full system access

### Passkeys Implementation
\`\`\`typescript
// IMPORTANT: Types come from @simplewebauthn/types, NOT @simplewebauthn/server
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
\`\`\`

### Role-Based Access

\`\`\`typescript
// Check admin access in API routes
const user = await prismaUsers.user.findUnique({
  where: { id: session.user.id },
  select: { role: true },
});

if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
\`\`\`

---

## 💰 Business Model: Marketplace SaaS

### Marketplace Structure
- **Platform/Intermediary model** - Buyer-Seller contracts
- Platform is NOT merchant of record for individual purchases
- Subscriptions are direct contracts with platform

### Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | €0/month | Basic features |
| Pro | €5/month | Intermediate features, can sell |
| Max | €20/month | All premium content, advanced features |

### Revenue Split
- **70% to seller** / **30% to platform**
- Minimum price for paid content: €5
- Minimum payout: €5 via PayPal

### Stripe Integration

\`\`\`typescript
// lib/stripe.ts
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

export function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  return stripe;
}

// Price IDs from environment
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  MAX_MONTHLY: process.env.STRIPE_PRICE_MAX_MONTHLY,
};
\`\`\`

### Webhook Handling

\`\`\`typescript
// api/billing/webhook/route.ts
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
\`\`\`

---

## 🚀 Deployment with GitOps

### Docker Registry
- Private registry for Docker images
- Versioning: Always semver (e.g., \`0.5.26\`), NEVER \`:latest\`

### Build & Push Process
\`\`\`bash
# 1. Build image with new version
docker build -t registry.example.com/myapp:X.Y.Z .

# 2. Push to registry
docker push registry.example.com/myapp:X.Y.Z

# 3. Update docker-compose.yml with new version
# 4. Commit and push to GitOps repo
# 5. Deploy via container management API
\`\`\`

### Healthcheck Configuration
\`\`\`yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U myapp"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s  # CRITICAL: Give DB time to initialize
\`\`\`

---

## 📜 Legal Compliance (EU/GDPR)

### Privacy Requirements
- Physical address disclosed
- Legal basis: Contract + Legitimate Interest
- No DPO appointed (stated in privacy policy)
- Self-hosted analytics (cookieless)
- AEPD complaint rights mentioned
- Data deletion within 30 days of request

### EU Consumer Rights
- 14-day withdrawal waived with explicit consent at checkout
- Consent checkbox required before purchase
- Store: user ID, timestamp, Terms version hash

### Key Legal Documents
- \`/privacy\` - Privacy Policy (GDPR compliant)
- \`/terms\` - Terms of Service (marketplace clauses)
- Governing law: **Spain** (EU)

---

## 🔧 Code Conventions

### General Rules
- Use TypeScript strict mode
- Format with Prettier
- Lint with ESLint
- Use \`text-foreground\` for readable text
- Navigation order: \`Pricing | Templates | Docs | [UserMenu]\`

### API Routes Pattern
\`\`\`typescript
// Always check authentication
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Use appropriate database client
import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";
\`\`\`

### Security Patterns
1. **Never reveal if email exists** (user enumeration)
2. **Always check ownership** for user resources (IDOR prevention)
3. **Use \`useSession()\`** from NextAuth, never localStorage
4. **Sanitize user input** before storing
5. **Validate \`callbackUrl\`** - only relative paths or same-origin

---

## 📁 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── billing/      # Stripe endpoints
│   │   └── user/         # User management
│   └── [page]/page.tsx    # Page components
├── components/
│   ├── ui/                # shadcn/ui components
│   └── [component].tsx    # Feature components
├── lib/
│   ├── db-app.ts          # App database client
│   ├── db-users.ts        # Users database client
│   ├── auth.ts            # NextAuth config
│   ├── stripe.ts          # Stripe config
│   └── utils.ts           # Utilities
└── types/                 # TypeScript types
\`\`\`

---

## 🛠️ Common Tasks

### Adding a New Page
1. Create \`src/app/[pagename]/page.tsx\`
2. Add navigation link to header
3. Include proper header/footer components
4. Use \`text-foreground\` for body text

### Database Schema Changes
\`\`\`bash
# 1. Edit schema file
# 2. Generate clients
npm run db:generate
# 3. Push to database
npm run db:push
# 4. Build and deploy
\`\`\`

### Adding a New API Endpoint
1. Create route in \`src/app/api/[resource]/route.ts\`
2. Add authentication check
3. Validate input with Zod
4. Use appropriate Prisma client
5. Return proper status codes

---

## ⚠️ Known Issues

1. **\`useSearchParams\` requires Suspense boundary** in client components
2. **Database pages need \`export const dynamic = "force-dynamic"\`**
3. **Container name conflicts**: Run \`docker rm -f <name>\` before recreating
4. **Healthcheck failures**: Ensure \`start_period\` is configured

---

## 📋 Checklist for AI Agents

Before completing a task, verify:

- [ ] Code changes are committed and pushed
- [ ] Docker image is built with incremented version
- [ ] Docker image is pushed to registry
- [ ] docker-compose.yml is updated
- [ ] Changes are committed and pushed
- [ ] Deployment executed
- [ ] Site is accessible after deployment

---

## 🤖 AI Instructions Summary

### When Building Features
1. Check existing patterns first
2. Use the appropriate database client
3. Add proper authentication
4. Validate all input
5. Handle errors gracefully
6. Deploy immediately after changes

### When Debugging
- Check container status first
- Review logs for errors
- Verify database connections
- Check environment variables

### Code Quality
- TypeScript strict mode always
- No \`any\` types
- Proper error handling
- Security-first approach

---

*This blueprint represents real production patterns from a live SaaS application with thousands of users.*
`,
    tier: "ADVANCED" as const,
    tags: ["saas", "nextjs", "stripe", "prisma", "authentication", "production", "premium", "dual-database", "gdpr"],
    category: "SaaS",
    difficulty: "advanced",
    price: 1999, // €19.99 - premium price for the real blueprint
  },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Create blueprints
    const created = [];
    for (const blueprint of SAMPLE_BLUEPRINTS) {
      const existing = await prismaUsers.userTemplate.findFirst({
        where: { name: blueprint.name, userId: session.user.id },
      });

      if (!existing) {
        const template = await prismaUsers.userTemplate.create({
          data: {
            userId: session.user.id,
            name: blueprint.name,
            description: blueprint.description,
            type: blueprint.type,
            content: blueprint.content,
            tier: blueprint.tier,
            tags: blueprint.tags,
            category: blueprint.category,
            difficulty: blueprint.difficulty,
            price: blueprint.price,
            currency: "EUR",
            isPublic: true,
            isOfficial: true,
            compatibleWith: ["cursor", "claude", "copilot", "windsurf"],
          },
        });
        created.push({ name: template.name, price: blueprint.price });
      }
    }

    return NextResponse.json({
      message: `Created ${created.length} blueprints`,
      created,
    });
  } catch (error) {
    console.error("Seed blueprints error:", error);
    return NextResponse.json(
      { error: "Failed to seed blueprints" },
      { status: 500 }
    );
  }
}
