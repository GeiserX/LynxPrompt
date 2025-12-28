"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Github, Chrome, ArrowLeft, Loader2, Terminal, CheckCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Turnstile } from "@/components/turnstile";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const cliSession = searchParams.get("cli_session");
  const { data: session, status } = useSession();
  const [cliAuthComplete, setCliAuthComplete] = useState(false);
  const [cliAuthError, setCliAuthError] = useState<string | null>(null);

  // Handle CLI authentication callback when user is already authenticated
  useEffect(() => {
    if (cliSession && status === "authenticated" && session?.user && !cliAuthComplete && !cliAuthError) {
      // Complete CLI authentication
      fetch("/api/cli-auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: cliSession }),
      })
        .then((res) => {
          if (res.ok) {
            setCliAuthComplete(true);
          } else {
            return res.json().then((data) => {
              setCliAuthError(data.error || "Failed to complete CLI authentication");
            });
          }
        })
        .catch((err) => {
          console.error("CLI auth callback error:", err);
          setCliAuthError("Failed to complete CLI authentication");
        });
    }
  }, [cliSession, status, session, cliAuthComplete, cliAuthError]);

  // Show CLI success screen
  if (cliAuthComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600/10 to-pink-600/10 p-8">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-2xl font-bold">CLI Authentication Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            You can now return to your terminal.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This window can be safely closed.
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show CLI auth pending (user needs to sign in first)
  if (cliSession && status === "unauthenticated") {
    // Continue to normal sign-in flow, but with CLI context shown
  }

  // SECURITY: Validate callbackUrl to prevent open redirect attacks
  // For CLI sessions, redirect back to the signin page with CLI param after OAuth
  const rawCallbackUrl = cliSession 
    ? `/auth/signin?cli_session=${cliSession}`
    : (searchParams.get("callbackUrl") || "/dashboard");
  const callbackUrl = (() => {
    // Only allow relative URLs or same-origin URLs
    if (rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")) {
      return rawCallbackUrl;
    }
    try {
      const url = new URL(rawCallbackUrl, window.location.origin);
      // Only allow same origin
      if (url.origin === window.location.origin) {
        return rawCallbackUrl;
      }
    } catch {
      // Invalid URL, use default
    }
    return "/dashboard"; // Default safe redirect
  })();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);

  // Turnstile is always enabled for magic link (component handles bypass internally)
  const turnstileEnabled = true;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setTurnstileError(null);
    setMagicLinkError(null);

    // Verify turnstile if enabled
    if (turnstileEnabled && !turnstileToken) {
      setTurnstileError("Please complete the security verification.");
      return;
    }

    setIsLoading(true);
    setLoadingProvider("email");

    try {
      // Verify turnstile token first
      if (turnstileEnabled && turnstileToken) {
        const verifyRes = await fetch("/api/auth/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });

        if (!verifyRes.ok) {
          setTurnstileError("Security verification failed. Please try again.");
          setIsLoading(false);
          setLoadingProvider(null);
          setTurnstileToken(null);
          return;
        }
      }

      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      // Debug: Log the signIn result
      console.log("Magic link signIn result:", JSON.stringify(result, null, 2));

      if (result?.ok) {
        setEmailSent(true);
      } else if (result?.error) {
        // Show user-friendly error message
        console.error("Magic link signIn error:", result.error);
        setMagicLinkError("Could not send magic link. Please try again later or use another sign-in method.");
      } else {
        // Unknown error - signIn returned but neither ok nor error
        console.error("Magic link signIn failed with no error message. Result:", result);
        setMagicLinkError("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Magic link error:", error);
      setMagicLinkError("Could not send magic link. Please try again later.");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleOAuth = async (provider: "github" | "google") => {
    setIsLoading(true);
    setLoadingProvider(provider);

    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-purple-600 to-pink-600 p-12 text-white lg:flex">
        <div className="w-fit rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90">
          <Logo />
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Your AI configurations,{" "}
            <span className="text-white/80">always at hand</span>
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Sign in to save your preferences, create custom blueprints, and share
            your configurations with the community.
          </p>

          <div className="mt-8 space-y-4">
            <Feature text="Save and sync your configurations" />
            <Feature text="Access your blueprints from anywhere" />
            <Feature text="Share and discover community blueprints" />
            <Feature text="Get personalized recommendations" />
          </div>
        </div>

        <p className="text-sm text-white/60">
          Â© 2025 LynxPrompt by{" "}
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

      {/* Right side - Sign in form */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <div className="w-fit rounded-lg bg-background px-2 py-1.5">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <Button variant="ghost" size="sm" asChild className="mb-8">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>

            {/* CLI Authentication notice */}
            {cliSession && (
              <div className="mb-6 rounded-lg bg-primary/10 p-4">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">CLI Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Sign in to authorize the LynxPrompt CLI
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CLI Auth Error */}
            {cliAuthError && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {cliAuthError}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error === "OAuthAccountNotLinked"
                  ? "This email is already associated with another account."
                  : error === "Configuration"
                    ? "Server configuration error. Please try again later."
                    : "An error occurred. Please try again."}
              </div>
            )}

            {!emailSent ? (
              <>
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="mt-2 text-muted-foreground">
                  Sign in to your account to continue
                </p>

                {/* OAuth Buttons */}
                <div className="mt-8 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleOAuth("github")}
                    disabled={isLoading}
                  >
                    {loadingProvider === "github" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Github className="h-5 w-5" />
                    )}
                    Continue with GitHub
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleOAuth("google")}
                    disabled={isLoading}
                  >
                    {loadingProvider === "google" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Chrome className="h-5 w-5" />
                    )}
                    Continue with Google
                  </Button>
                </div>

                {/* Divider */}
                <div className="my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Magic Link */}
                <form onSubmit={handleMagicLink}>
                  <label className="text-sm font-medium">Email address</label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="mt-4 w-full"
                    disabled={isLoading || !email || (turnstileEnabled && !turnstileToken)}
                  >
                    {loadingProvider === "email" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      "Send magic link"
                    )}
                  </Button>

                  {/* Turnstile CAPTCHA */}
                  {turnstileEnabled && (
                    <div className="mt-4">
                      <Turnstile
                        onSuccess={(token) => {
                          setTurnstileToken(token);
                          setTurnstileError(null);
                        }}
                        onExpire={() => setTurnstileToken(null)}
                        onError={() => setTurnstileToken(null)}
                      />
                      {turnstileError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {turnstileError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Magic link error */}
                  {magicLinkError && (
                    <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {magicLinkError}
                    </div>
                  )}
                </form>

                {/* Terms notice - consent required for new users on separate page */}
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl font-bold">Check your email</h2>
                <p className="mt-2 text-muted-foreground">
                  We sent a magic link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click the link in the email to sign in to your account.
                </p>
                <Button
                  variant="outline"
                  className="mt-8"
                  onClick={() => setEmailSent(false)}
                >
                  Use a different email
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span>{text}</span>
    </div>
  );
}
