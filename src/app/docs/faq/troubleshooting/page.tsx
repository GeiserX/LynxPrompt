import Link from "next/link";

export default function TroubleshootingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <span>/</span>
          <span>Troubleshooting</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Troubleshooting</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Common issues and how to fix them.
        </p>
      </div>

      {/* Issues */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Common Issues</h2>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">
            My AI IDE isn&apos;t reading the config file
          </h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p>Check these common causes:</p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>File location:</strong> Make sure the file is in the
                correct location (e.g.,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">.cursor/rules</code>{" "}
                in project root)
              </li>
              <li>
                <strong>File name:</strong> Verify the exact filename (case
                sensitive on some systems)
              </li>
              <li>
                <strong>Restart IDE:</strong> Some IDEs need a restart to detect
                new config files
              </li>
              <li>
                <strong>Project open:</strong> Make sure you&apos;ve opened the
                project folder, not just a single file
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">I can&apos;t sign in with magic link</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Check your spam/junk folder</li>
              <li>Make sure you&apos;re clicking the link within 10 minutes</li>
              <li>Try requesting a new link</li>
              <li>
                If using a corporate email, your IT may be blocking links — try
                a personal email
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">OAuth sign-in failing</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Clear your browser cookies for lynxprompt.com</li>
              <li>Try a different browser or incognito mode</li>
              <li>
                Make sure you&apos;re allowing pop-ups for the OAuth provider
              </li>
              <li>
                Check if your GitHub/Google account has any security blocks
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Blueprint download not working</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Try using the &quot;Copy to clipboard&quot; option instead</li>
              <li>Check if your browser is blocking downloads</li>
              <li>
                For paid blueprints, make sure your purchase was successful
              </li>
              <li>Try refreshing the page and downloading again</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Payment was charged but no access</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p>This is usually a temporary sync delay. Try:</p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>Sign out and sign back in</li>
              <li>Wait a few minutes and refresh the page</li>
              <li>
                Check{" "}
                <Link
                  href="/settings/billing"
                  className="text-primary hover:underline"
                >
                  Settings → Billing
                </Link>{" "}
                to verify your subscription status
              </li>
              <li>
                If the issue persists, contact{" "}
                <a
                  href="mailto:support@lynxprompt.com"
                  className="text-primary hover:underline"
                >
                  support@lynxprompt.com
                </a>{" "}
                with your payment confirmation
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">AI editing not available</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>AI editing is only available to Max subscribers</li>
              <li>
                Check your subscription status in{" "}
                <Link
                  href="/settings/billing"
                  className="text-primary hover:underline"
                >
                  Settings → Billing
                </Link>
              </li>
              <li>
                If you&apos;re a Max subscriber and still can&apos;t access it,
                try signing out and back in
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Can&apos;t create paid blueprints</h3>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Only Pro and Max subscribers can create paid blueprints</li>
              <li>Make sure you&apos;ve verified your email</li>
              <li>
                Configure your PayPal email in settings for receiving payouts
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="rounded-xl border bg-muted/30 p-6">
        <h2 className="font-semibold">Still having issues?</h2>
        <p className="mt-2 text-muted-foreground">
          If none of these solutions work, contact us:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:support@lynxprompt.com"
              className="text-primary hover:underline"
            >
              support@lynxprompt.com
            </a>
          </li>
          <li>
            <strong>Include:</strong> Your account email, what you were trying
            to do, and any error messages you see
          </li>
        </ul>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/faq/billing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Billing FAQ
        </Link>
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          All Docs →
        </Link>
      </section>
    </div>
  );
}






