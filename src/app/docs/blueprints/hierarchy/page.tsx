import Link from "next/link";
import { FolderTree, Terminal, Globe, GitBranch, Layers, FileCode, Download, RefreshCw, AlertTriangle } from "lucide-react";

export default function MonorepoHierarchyPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/blueprints" className="hover:text-foreground">
            Blueprints
          </Link>
          <span>/</span>
          <span>Monorepo Hierarchy</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Monorepo Hierarchy</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Organize multiple AGENTS.md files in monorepo structures with parent-child relationships
          using <code className="text-primary">ha_</code> hierarchies.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Overview</h2>
        </div>
        <p className="text-muted-foreground">
          Large monorepos often have multiple AGENTS.md files at different levels—a root file with 
          organization-wide rules, and package-specific files with additional context. LynxPrompt 
          groups these into <strong>hierarchies</strong> (identified by <code className="text-primary">ha_</code> IDs)
          that you can pull and sync as a unit.
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`my-monorepo/
├── AGENTS.md              ← Root blueprint (organization rules)
├── packages/
│   ├── core/
│   │   └── AGENTS.md      ← Child blueprint (core-specific)
│   ├── web/
│   │   └── AGENTS.md      ← Child blueprint (web-specific)
│   └── mobile/
│       └── AGENTS.md      ← Child blueprint (mobile-specific)
└── services/
    ├── api/
    │   └── AGENTS.md      ← Child blueprint (api-specific)
    └── worker/
        └── AGENTS.md      ← Child blueprint (worker-specific)

→ All grouped under hierarchy: ha_xyz123`}</code>
          </pre>
        </div>
      </section>

      {/* ID Formats */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">ID Formats</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <code className="rounded bg-blue-500/10 px-2 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              bp_abc123
            </code>
            <h3 className="mt-2 font-medium">Blueprint ID</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Individual AGENTS.md file. Pull one file with <code>lynxp pull bp_xxx</code>
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="rounded bg-purple-500/10 px-2 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
              ha_xyz789
            </code>
            <h3 className="mt-2 font-medium">Hierarchy ID</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Group of related blueprints. Pull entire tree with <code>lynxp pull ha_xxx</code>
            </p>
          </div>
        </div>
      </section>

      {/* CLI: Push */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Pushing to a Hierarchy</h2>
        </div>
        <p className="text-muted-foreground">
          When you push AGENTS.md files, the CLI auto-detects the repository and creates/joins a hierarchy:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">1. Push root AGENTS.md (creates hierarchy)</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`cd my-monorepo
lynxp push AGENTS.md --name "My Org Rules"

# ✅ Created blueprint "My Org Rules"
#    ID: bp_abc123
#    Hierarchy: ha_xyz789  ← New hierarchy created`}</code>
            </pre>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">2. Push child AGENTS.md (joins hierarchy)</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`cd my-monorepo/packages/core
lynxp push AGENTS.md --name "Core Package Rules"

# ✅ Created blueprint "Core Package Rules"
#    ID: bp_def456
#    Hierarchy: ha_xyz789  ← Same hierarchy
#    Path: packages/core/AGENTS.md
#    ↳ Linked to parent: bp_abc123`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CLI: Pull Hierarchy */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Pulling a Hierarchy</h2>
        </div>
        <p className="text-muted-foreground">
          Pull an entire hierarchy to recreate the directory structure with all AGENTS.md files:
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`# Pull entire hierarchy
lynxp pull ha_xyz789

# 📥 Downloading blueprints...
#   ✓ AGENTS.md
#   ✓ packages/core/AGENTS.md
#   ✓ packages/web/AGENTS.md
#   ✓ services/api/AGENTS.md
# ✅ Downloaded 4 blueprint(s)

# Preview first
lynxp pull ha_xyz789 --preview`}</code>
          </pre>
        </div>
      </section>

      {/* CLI: List Hierarchies */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Listing Hierarchies</h2>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`lynxp hierarchies

# 📁 Your Hierarchies (2 total)
#
#   my-monorepo
#     ID: ha_xyz789
#     Blueprints: 6
#
#   other-project
#     ID: ha_abc456
#     Blueprints: 3`}</code>
          </pre>
        </div>
      </section>

      {/* Optimistic Locking */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-500/10 p-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold">Conflict Detection</h2>
        </div>
        <p className="text-muted-foreground">
          LynxPrompt uses optimistic locking to prevent accidental overwrites when collaborating:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-medium">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Each blueprint has a <code>content_checksum</code></li>
              <li>• When you push, the expected checksum is sent</li>
              <li>• If someone else pushed in between, you get a 409 Conflict</li>
              <li>• Pull latest changes, resolve, then push again</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="overflow-x-auto text-sm">
              <code>{`# Conflict detected
lynxp push AGENTS.md

# ⚠ Conflict: Blueprint has been modified
#   Someone else may have pushed changes.
#
# Options:
#   1. lynxp pull bp_xxx (get latest)
#   2. lynxp push --force (overwrite)`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* API */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">API Reference</h2>
        </div>
        <p className="text-muted-foreground">
          Access hierarchies programmatically via the v1 API:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">List hierarchies</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`GET /api/v1/hierarchies
Authorization: Bearer lp_xxx

# Response:
{
  "hierarchies": [
    {
      "id": "ha_xyz789",
      "name": "my-monorepo",
      "repository_root": "abc123...",
      "blueprint_count": 6
    }
  ]
}`}</code>
            </pre>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">Get hierarchy with blueprints</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`GET /api/v1/hierarchies/ha_xyz789
Authorization: Bearer lp_xxx

# Response includes:
# - hierarchy metadata
# - blueprints array (flat list)
# - tree structure (nested for traversal)`}</code>
            </pre>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">Create blueprint with hierarchy</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`POST /api/v1/blueprints
{
  "name": "Core Package",
  "content": "...",
  "visibility": "PRIVATE",
  "hierarchy_id": "ha_xyz789",
  "repository_path": "packages/core/AGENTS.md",
  "parent_id": "bp_abc123"
}`}</code>
            </pre>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">Update with conflict detection</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`PUT /api/v1/blueprints/bp_def456
{
  "content": "...",
  "expected_checksum": "abc123def456"
}

# 200 OK → Success
# 409 Conflict → Someone else modified it`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Dashboard View</h2>
        </div>
        <p className="text-muted-foreground">
          In your dashboard, hierarchical blueprints are shown in a collapsible &quot;Hierarchical Blueprints&quot;
          section. Click on a hierarchy to expand and see all its AGENTS.md files with their paths.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <FolderTree className="h-4 w-4" />
              <span className="font-medium">Hierarchical Blueprints</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs dark:bg-purple-900/30">
                6 files
              </span>
            </div>
            <div className="ml-6 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GitBranch className="h-3 w-3" />
                <span>my-monorepo (ha_xyz789)</span>
              </div>
              <div className="ml-4 space-y-0.5 font-mono text-xs">
                <div>AGENTS.md</div>
                <div className="text-muted-foreground/70">└─ packages/core/AGENTS.md</div>
                <div className="text-muted-foreground/70">└─ packages/web/AGENTS.md</div>
                <div className="text-muted-foreground/70">└─ services/api/AGENTS.md</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/blueprints/variables"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Variables
        </Link>
        <Link
          href="/docs/marketplace"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Marketplace →
        </Link>
      </section>
    </div>
  );
}
