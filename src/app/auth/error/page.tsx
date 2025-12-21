"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { Logo } from "@/components/logo";

const ERROR_MESSAGES: Record<
  string,
  { title: string; description: string; action?: string }
> = {
  Configuration: {
    title: "Configuration Error",
    description:
      "There's a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You don't have permission to sign in with this account.",
  },
  Verification: {
    title: "Link Expired or Already Used",
    description:
      "This magic link has expired or has already been used. Magic links can only be used once and expire after 24 hours.",
    action: "request_new",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description:
      "There was a problem starting the sign in process. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description:
      "There was a problem completing the sign in. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description:
      "Could not create your account. An account with this email may already exist.",
  },
  EmailCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account using this email address.",
  },
  Callback: {
    title: "Callback Error",
    description: "There was a problem during the authentication callback.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description:
      "This email is already associated with another sign-in method. Please sign in using your original method.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    description: "The email could not be sent. Please try again later.",
  },
  CredentialsSignin: {
    title: "Sign In Failed",
    description: "The credentials you provided are invalid.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "You need to be signed in to access this page.",
    action: "signin",
  },
  Default: {
    title: "Authentication Error",
    description:
      "An unexpected error occurred during authentication. Please try again.",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "Default";
  const error = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Logo />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">{error.title}</h1>
          <p className="mb-8 text-muted-foreground">{error.description}</p>

          <div className="flex flex-col gap-3">
            {error.action === "request_new" && (
              <Button asChild size="lg" className="w-full">
                <Link href="/auth/signin">
                  <Mail className="mr-2 h-4 w-4" />
                  Request New Magic Link
                </Link>
              </Button>
            )}

            {error.action === "signin" && (
              <Button asChild size="lg" className="w-full">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}

            {!error.action && (
              <Button asChild size="lg" className="w-full">
                <Link href="/auth/signin">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
            )}

            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {errorType !== "Default" && (
            <p className="mt-8 text-xs text-muted-foreground">
              Error code: {errorType}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}

