import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/favicon.ico" alt="LynxPrompt" className="h-4 w-4" />
          <p className="text-sm text-muted-foreground">
            © 2025 LynxPrompt by{" "}
            <a
              href="https://geiser.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Geiser Cloud
            </a>
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:underline"
          >
            Terms
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:underline"
          >
            About
          </Link>
          <a
            href="https://status.lynxprompt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}

