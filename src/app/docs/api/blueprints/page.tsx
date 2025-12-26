import Link from "next/link";
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
                      Filter by visibility: private, public, or unlisted
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        platform
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">string</td>
                    <td className="py-2 text-muted-foreground">
                      Filter by platform: cursor, claude, copilot, windsurf, agentsmd
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
     "https://lynxprompt.com/api/v1/blueprints?visibility=private"`}</code>
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
      "visibility": "private",
      "platform": "cursor",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T14:45:00.000Z"
    }
  ],
  "total": 1
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
     https://lynxprompt.com/api/v1/blueprints/bp_clw2m8k0x0001`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "id": "bp_clw2m8k0x0001",
  "name": "My React Config",
  "description": "Custom rules for React projects",
  "content": "You are an expert React developer...",
  "visibility": "private",
  "platform": "cursor",
  "variables": [
    { "name": "PROJECT_NAME", "default": "my-app" },
    { "name": "FRAMEWORK", "default": null }
  ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:45:00.000Z"
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
  "name": "My New Config",
  "description": "Description of the blueprint",
  "content": "You are an expert developer...",
  "visibility": "private",  // private, public, or unlisted
  "platform": "cursor"      // cursor, claude, copilot, windsurf, agentsmd
}`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -X POST https://lynxprompt.com/api/v1/blueprints \\
     -H "Authorization: Bearer lp_your_token" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "My New Config",
       "content": "You are an expert developer...",
       "visibility": "private",
       "platform": "cursor"
     }'`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "id": "bp_clw2m8k0x0002",
  "name": "My New Config",
  "visibility": "private",
  "platform": "cursor",
  "createdAt": "2025-01-21T09:00:00.000Z"
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
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -X PUT https://lynxprompt.com/api/v1/blueprints/bp_clw2m8k0x0001 \\
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
  "id": "bp_clw2m8k0x0001",
  "name": "My React Config",
  "visibility": "private",
  "platform": "cursor",
  "updatedAt": "2025-01-21T10:00:00.000Z"
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
                <code>{`curl -X DELETE https://lynxprompt.com/api/v1/blueprints/bp_clw2m8k0x0001 \\
     -H "Authorization: Bearer lp_your_token"`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{ "success": true }`}</code>
              </pre>
            </div>
          </div>
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
          curl -X PUT https://lynxprompt.com/api/v1/blueprints/bp_your_id \\
               -H "Authorization: Bearer \${{ secrets.LYNXPROMPT_API_TOKEN }}" \\
               -H "Content-Type: application/json" \\
               -d "{\\"content\\": \\"$(cat .cursor/rules | jq -Rs .)\\"}"
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

