import Link from "next/link";
import { APP_URL } from "@/lib/feature-flags";
import { FileCode, ArrowRight } from "lucide-react";

export default function BlueprintsApiDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileCode className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Blueprints API</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Create, read, update, and delete your blueprints programmatically.
        </p>
      </div>

      {/* Required role notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-blue-600 dark:text-blue-400">Required Role:</strong>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            BLUEPRINTS_FULL
          </code>{" "}
          for write operations,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            BLUEPRINTS_READONLY
          </code>{" "}
          for read-only access.
        </p>
      </div>

      {/* Blueprint ID format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Blueprint ID Format</h2>
        <p className="text-muted-foreground">
          Blueprint IDs use the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">bp_</code>{" "}
          prefix for easy identification:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <code className="text-sm text-zinc-100">bp_clw2m8k0x0001</code>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Endpoints</h2>

        {/* GET /blueprints */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-green-500/10 px-2 py-1 text-sm font-semibold text-green-600">
              GET
            </code>
            <code className="text-sm">/api/v1/blueprints</code>
          </div>
          <p className="text-muted-foreground">
            List all blueprints you have access to (your own blueprints).
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Query Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left">Parameter</th>
                    <th className="py-2 pr-4 text-left">Type</th>
                    <th className="py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        visibility
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">string</td>
                    <td className="py-2 text-muted-foreground">
                      Filter by visibility: private, team, or public (default: all)
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        limit
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">number</td>
                    <td className="py-2 text-muted-foreground">
                      Page size, up to 100 (default: 50)
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        offset
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">number</td>
                    <td className="py-2 text-muted-foreground">
                      Number of blueprints to skip (default: 0)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -H "Authorization: Bearer lp_your_token" \\
     "${APP_URL}/api/v1/blueprints?visibility=private"`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "blueprints": [
    {
      "id": "bp_clw2m8k0x0001",
      "name": "My React Config",
      "description": "Custom rules for React projects",
      "type": "AGENTS_MD",
      "tier": "SHORT",
      "category": "web",
      "tags": ["react", "typescript"],
      "visibility": "PRIVATE",
      "downloads": 0,
      "favorites": 0,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-20T14:45:00.000Z",
      "hierarchy_id": null,
      "parent_id": null,
      "repository_path": null,
      "content_checksum": "3f2a9c1d8e7b6a50"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "has_more": false
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* GET /blueprints/:id */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-green-500/10 px-2 py-1 text-sm font-semibold text-green-600">
              GET
            </code>
            <code className="text-sm">/api/v1/blueprints/:id</code>
          </div>
          <p className="text-muted-foreground">
            Get a specific blueprint by ID, including its full content.
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -H "Authorization: Bearer lp_your_token" \\
     ${APP_URL}/api/v1/blueprints/bp_clw2m8k0x0001`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "blueprint": {
    "id": "bp_clw2m8k0x0001",
    "name": "My React Config",
    "description": "Custom rules for React projects",
    "content": "You are an expert React developer...",
    "type": "AGENTS_MD",
    "tier": "SHORT",
    "category": "web",
    "tags": ["react", "typescript"],
    "visibility": "PRIVATE",
    "variables": { "PROJECT_NAME": "my-app" },
    "downloads": 0,
    "favorites": 0,
    "ai_assisted": false,
    "showcase_url": null,
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-20T14:45:00.000Z",
    "hierarchy_id": null,
    "parent_id": null,
    "repository_path": null,
    "content_checksum": "3f2a9c1d8e7b6a50"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* POST /blueprints */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-blue-500/10 px-2 py-1 text-sm font-semibold text-blue-600">
              POST
            </code>
            <code className="text-sm">/api/v1/blueprints</code>
          </div>
          <p className="text-muted-foreground">
            Create a new blueprint.
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Request Body</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "name": "My New Config",              // required, 3+ characters
  "content": "You are an expert developer...", // required, 10+ characters
  "description": "Description of the blueprint",
  "type": "AGENTS_MD",                  // default AGENTS_MD
  "category": "other",                  // default other
  "tags": ["react"],                    // up to 10
  "visibility": "PRIVATE"               // PRIVATE (default), TEAM or PUBLIC
}

// content_base64 can replace content when a proxy or WAF
// blocks code in the request body.`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -X POST ${APP_URL}/api/v1/blueprints \\
     -H "Authorization: Bearer lp_your_token" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "My New Config",
       "content": "You are an expert developer...",
       "visibility": "PRIVATE"
     }'`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`// 201 Created
{
  "success": true,
  "blueprint": {
    "id": "bp_clw2m8k0x0002",
    "name": "My New Config",
    "description": null,
    "type": "AGENTS_MD",
    "tier": "SHORT",
    "category": "other",
    "tags": [],
    "visibility": "PRIVATE",
    "created_at": "2025-01-21T09:00:00.000Z",
    "updated_at": "2025-01-21T09:00:00.000Z",
    "hierarchy_id": null,
    "parent_id": null,
    "repository_path": null,
    "content_checksum": "9b1e4d7c2a3f8e60"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* PUT /blueprints/:id */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-amber-500/10 px-2 py-1 text-sm font-semibold text-amber-600">
              PUT
            </code>
            <code className="text-sm">/api/v1/blueprints/:id</code>
          </div>
          <p className="text-muted-foreground">
            Update an existing blueprint. Only include fields you want to change.
            Send <code className="rounded bg-muted px-1.5 py-0.5">expected_checksum</code> (the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">content_checksum</code> you last read)
            to refuse the update with 409 Conflict if someone changed the blueprint in between.
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -X PUT ${APP_URL}/api/v1/blueprints/bp_clw2m8k0x0001 \\
     -H "Authorization: Bearer lp_your_token" \\
     -H "Content-Type: application/json" \\
     -d '{
       "content": "Updated content with new rules..."
     }'`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "success": true,
  "blueprint": {
    "id": "bp_clw2m8k0x0001",
    "name": "My React Config",
    "content": "Updated content with new rules...",
    "visibility": "PRIVATE",
    "updated_at": "2025-01-21T10:00:00.000Z",
    "content_checksum": "c4d2e9a1b7f3086e"
    // ...plus description, type, tier, category, tags, created_at
    // and the hierarchy fields
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* DELETE /blueprints/:id */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-red-500/10 px-2 py-1 text-sm font-semibold text-red-600">
              DELETE
            </code>
            <code className="text-sm">/api/v1/blueprints/:id</code>
          </div>
          <p className="text-muted-foreground">
            Delete a blueprint. This action cannot be undone.
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -X DELETE ${APP_URL}/api/v1/blueprints/bp_clw2m8k0x0001 \\
     -H "Authorization: Bearer lp_your_token"`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{ "success": true, "message": "Blueprint \"My React Config\" deleted successfully" }`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Platform-specific examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Platform-Specific Commands</h2>
        <p className="text-muted-foreground">
          Here are examples for updating blueprints from different operating systems:
        </p>

        {/* Linux/macOS */}
        <div className="space-y-2">
          <h4 className="font-semibold">Linux / macOS (bash)</h4>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Set your API token
export LYNXPROMPT_API_TOKEN="lp_your_token_here"

# Update blueprint from file
curl -X PUT ${APP_URL}/api/v1/blueprints/bp_your_id \\
     -H "Authorization: Bearer $LYNXPROMPT_API_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d "{\\"content\\": $(cat .cursor/rules | jq -Rs .)}"
`}</code>
            </pre>
          </div>
          <p className="text-sm text-muted-foreground">
            Requires <code className="rounded bg-muted px-1.5 py-0.5">jq</code> for JSON escaping. 
            Install with <code className="rounded bg-muted px-1.5 py-0.5">brew install jq</code> (macOS) or 
            <code className="rounded bg-muted px-1.5 py-0.5">sudo apt install jq</code> (Linux).
          </p>
        </div>

        {/* Windows PowerShell */}
        <div className="space-y-2">
          <h4 className="font-semibold">Windows (PowerShell)</h4>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Set your API token
$env:LYNXPROMPT_API_TOKEN = "lp_your_token_here"

# Read file and update blueprint
$content = (Get-Content ".cursor\\rules" -Raw) -replace '"', '\\"'
$body = @{ content = $content } | ConvertTo-Json
Invoke-RestMethod -Uri "${APP_URL}/api/v1/blueprints/bp_your_id" \`
  -Method PUT \`
  -Headers @{ "Authorization" = "Bearer $env:LYNXPROMPT_API_TOKEN"; "Content-Type" = "application/json" } \`
  -Body $body
`}</code>
            </pre>
          </div>
        </div>

        {/* WSL */}
        <div className="space-y-2">
          <h4 className="font-semibold">WSL (Windows Subsystem for Linux)</h4>
          <p className="text-sm text-muted-foreground">
            Use the same commands as Linux/macOS. To access Windows files, use <code className="rounded bg-muted px-1.5 py-0.5">/mnt/c/...</code> paths.
          </p>
        </div>
      </section>

      {/* Syncing from CI/CD */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Syncing from CI/CD</h2>
        <p className="text-muted-foreground">
          Use the API to automatically sync your AI configuration files from your
          CI/CD pipeline. Here&apos;s an example GitHub Actions workflow:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`# .github/workflows/sync-lynxprompt.yml
name: Sync LynxPrompt

on:
  push:
    paths:
      - '.cursor/rules'
      - 'CLAUDE.md'
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Sync to LynxPrompt
        run: |
          curl -X PUT ${APP_URL}/api/v1/blueprints/bp_your_id \\
               -H "Authorization: Bearer \${{ secrets.LYNXPROMPT_API_TOKEN }}" \\
               -H "Content-Type: application/json" \\
               -d "{\\"content\\": $(cat .cursor/rules | jq -Rs .)}"
`}</code>
          </pre>
        </div>
      </section>

      {/* Error responses */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Error Responses</h2>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <code className="rounded bg-red-500/10 px-2 py-1 text-sm text-red-600">
              404 Not Found
            </code>
            <span className="ml-2 text-muted-foreground">
              - Blueprint doesn&apos;t exist or you don&apos;t have access
            </span>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="rounded bg-amber-500/10 px-2 py-1 text-sm text-amber-600">
              400 Bad Request
            </code>
            <span className="ml-2 text-muted-foreground">
              - Missing or invalid fields in request body
            </span>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="rounded bg-amber-500/10 px-2 py-1 text-sm text-amber-600">
              403 Forbidden
            </code>
            <span className="ml-2 text-muted-foreground">
              - Token doesn&apos;t have required permissions
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

