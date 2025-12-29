import Link from "next/link";
import { User } from "lucide-react";

export default function UserApiDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">User API</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Access and manage user profile information.
        </p>
      </div>

      {/* Required role notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-blue-600 dark:text-blue-400">Required Role:</strong>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            PROFILE_FULL
          </code>{" "}
          or{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">FULL</code>
        </p>
      </div>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Endpoints</h2>

        {/* GET /user */}
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <code className="rounded bg-green-500/10 px-2 py-1 text-sm font-semibold text-green-600">
              GET
            </code>
            <code className="text-sm">/api/v1/user</code>
          </div>
          <p className="text-muted-foreground">
            Get the current user&apos;s profile information.
          </p>
          <div>
            <h4 className="mb-2 font-semibold">Example Request</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`curl -H "Authorization: Bearer lp_your_token" \\
     https://lynxprompt.com/api/v1/user`}</code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "id": "usr_clw2m8k0x0001",
  "email": "user@example.com",
  "name": "John Doe",
  "image": "https://avatars.githubusercontent.com/u/12345",
  "plan": "PRO",
  "createdAt": "2024-06-15T10:30:00.000Z"
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Response fields */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Response Fields</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left">Field</th>
                <th className="py-2 pr-4 text-left">Type</th>
                <th className="py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">id</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string</td>
                <td className="py-2 text-muted-foreground">
                  Unique user identifier
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">email</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string</td>
                <td className="py-2 text-muted-foreground">
                  User&apos;s email address
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">name</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string | null</td>
                <td className="py-2 text-muted-foreground">
                  User&apos;s display name
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">image</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string | null</td>
                <td className="py-2 text-muted-foreground">
                  URL to profile image
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">plan</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string</td>
                <td className="py-2 text-muted-foreground">
                  Subscription tier: FREE, PRO, MAX, or TEAMS
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1.5 py-0.5">createdAt</code>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">string</td>
                <td className="py-2 text-muted-foreground">
                  ISO 8601 timestamp of account creation
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Use cases */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Use Cases</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Verify your API token is working correctly
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Check your current subscription tier before making API calls
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Display user information in third-party integrations
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}






