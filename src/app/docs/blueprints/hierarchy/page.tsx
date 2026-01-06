import Link from "next/link";
import { FolderTree, Terminal, Globe, GitBranch, Layers, FileCode } from "lucide-react";

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
          Organize multiple AGENTS.md files in monorepo structures with parent-child relationships.
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
          detects and preserves this hierarchy when you push blueprints.
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
        └── AGENTS.md      ← Child blueprint (worker-specific)`}</code>
          </pre>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How Hierarchy Works</h2>
        </div>
        <p className="text-muted-foreground">
          When you push AGENTS.md files from a monorepo, LynxPrompt stores:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-medium">Repository Root</h3>
            <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
              repository_root
            </code>
            <p className="mt-2 text-sm text-muted-foreground">
              Identifies which repository/monorepo this blueprint belongs to
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-medium">Repository Path</h3>
            <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
              repository_path
            </code>
            <p className="mt-2 text-sm text-muted-foreground">
              Relative path within the repo (e.g., <code className="text-xs">packages/core</code>)
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-medium">Parent Blueprint</h3>
            <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
              parent_id
            </code>
            <p className="mt-2 text-sm text-muted-foreground">
              Links child blueprints to their parent (root AGENTS.md)
            </p>
          </div>
        </div>
      </section>

      {/* CLI Usage */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Using the CLI</h2>
        </div>
        <p className="text-muted-foreground">
          The CLI automatically detects hierarchy when pushing AGENTS.md files:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">Push a root AGENTS.md</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`# From your monorepo root
cd my-monorepo
lynxp push AGENTS.md --name "My Org Rules"

# Output:
# ✅ Created blueprint "My Org Rules"
#    ID: bp_abc123
#    Repository: my-monorepo (root)`}</code>
            </pre>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-2 font-medium text-sm">Push a child AGENTS.md</h3>
            <pre className="overflow-x-auto text-sm">
              <code>{`# From a package directory
cd my-monorepo/packages/core
lynxp push AGENTS.md --name "Core Package Rules"

# Output:
# ✅ Created blueprint "Core Package Rules"
#    ID: bp_def456
#    Repository: my-monorepo
#    Path: packages/core
#    Parent: bp_abc123 (My Org Rules)  ← Auto-detected!`}</code>
            </pre>
          </div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/50 dark:bg-sky-900/30">
          <div className="flex items-start gap-2">
            <GitBranch className="h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-300 mt-0.5" />
            <div>
              <h3 className="font-medium text-sky-800 dark:text-sky-200">Automatic Detection</h3>
              <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                The CLI uses git to find the repository root and calculates the relative path. 
                It also searches your existing blueprints to find and link to parent AGENTS.md files automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Web UI */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Web UI</h2>
        </div>
        <p className="text-muted-foreground">
          When creating AGENTS_MD blueprints in the web interface, you can manually specify hierarchy:
        </p>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">1</span>
            <div>
              <p className="font-medium">Enable hierarchy mode</p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Part of a monorepo hierarchy?&quot; when creating an AGENTS_MD blueprint
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">2</span>
            <div>
              <p className="font-medium">Set repository identifier</p>
              <p className="text-sm text-muted-foreground">
                Enter a unique name for your repository (e.g., &quot;my-org/monorepo&quot;)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">3</span>
            <div>
              <p className="font-medium">Specify path and parent</p>
              <p className="text-sm text-muted-foreground">
                Set the relative path (leave empty for root) and optionally link to a parent blueprint
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard View */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Dashboard View</h2>
        </div>
        <p className="text-muted-foreground">
          Hierarchical blueprints appear in a special section on your dashboard:
        </p>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <strong>Grouped by repository</strong> — All AGENTS.md files from the same repo are grouped together
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <strong>Expandable tree view</strong> — Click to expand and see all blueprints in a repository
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <strong>Path display</strong> — Each blueprint shows its relative path within the repo
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <strong>Quick access</strong> — Click any blueprint to view or edit it
            </li>
          </ul>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground mb-2">Example dashboard view:</p>
          <pre className="overflow-x-auto text-sm">
            <code>{`📁 Hierarchical Blueprints
└─ my-org/monorepo
   ├─ [root] My Org Rules
   ├─ packages/core → Core Package Rules
   ├─ packages/web → Web App Rules
   └─ services/api → API Service Rules`}</code>
          </pre>
        </div>
      </section>

      {/* API */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">API Reference</h2>
        <p className="text-muted-foreground">
          When creating blueprints via the API, include hierarchy fields:
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`POST /api/v1/blueprints
{
  "name": "Core Package Rules",
  "content": "# Core Package\\n\\n...",
  "type": "AGENTS_MD",
  "visibility": "PRIVATE",
  
  // Hierarchy fields (optional)
  "repository_root": "my-org/monorepo",
  "repository_path": "packages/core",
  "parent_id": "bp_abc123"  // ID of parent blueprint
}`}</code>
          </pre>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/50 dark:bg-amber-900/20">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">Note</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The <code className="rounded bg-muted px-1 py-0.5 text-xs">parent_id</code> must reference 
            a blueprint you own. You cannot link to other users&apos; blueprints as parents.
          </p>
        </div>
      </section>

      {/* Best practices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Best Practices</h2>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Push root first</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Always push your root AGENTS.md before child files. This ensures the parent 
              blueprint exists for children to link to.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Use consistent repository identifiers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The CLI uses git to auto-detect repository roots, ensuring consistency. 
              When using the web UI, use a consistent naming scheme like <code className="rounded bg-muted px-1 py-0.5 text-xs">org/repo-name</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep paths relative</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Repository paths should be relative to the repo root (e.g., <code className="rounded bg-muted px-1 py-0.5 text-xs">packages/core</code>), 
              not absolute filesystem paths.
            </p>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/blueprints/variables"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Template Variables
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

