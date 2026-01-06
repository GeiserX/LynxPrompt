"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Key, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { startAuthentication } from "@simplewebauthn/browser";

function VerifyPasskeyContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  // Auto-start verification on mount
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && !autoStarted) {
      setAutoStarted(true);
      // Small delay to let the page render before prompting
      const timer = setTimeout(() => {
        handleVerify();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, session?.user?.email, autoStarted]);

  const handleVerify = async () => {
    if (!session?.user?.email) return;

    setVerifying(true);
    setError(null);

    try {
      // Get authentication options
      const optionsRes = await fetch("/api/auth/passkey/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "Failed to get authentication options");
      }

      const { options } = await optionsRes.json();

      // Prompt user for passkey
      const authResp = await startAuthentication(options);

      // Verify the response
      const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authResponse: authResp }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Verification failed");
      }

      // Success! Redirect to intended destination
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Passkey verification error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify passkey. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-purple-600 to-pink-600 p-12 text-white lg:flex">
        <div className="w-fit rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90">
          <Logo />
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Verify your identity
          </h1>
          <p className="mt-4 text-lg text-white/80">
            For your security, please verify with your passkey to continue.
          </p>

          <div className="mt-8 space-y-4">
            <Feature text="Passwordless & secure" />
            <Feature text="Uses your device's biometrics" />
            <Feature text="Protects your account from unauthorized access" />
          </div>
        </div>

        <p className="text-sm text-white/60">
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

      {/* Right side - Verification */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <div className="w-fit rounded-lg bg-background px-2 py-1.5">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-sm text-center">
            {/* Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>

            <h2 className="mt-6 text-2xl font-bold">Passkey Verification</h2>
            <p className="mt-2 text-muted-foreground">
              Your account has passkey protection enabled. Please verify your
              identity to continue.
            </p>

            {/* Error message */}
            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verify button */}
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="mt-8 w-full"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-5 w-5" />
                  Verify with Passkey
                </>
              )}
            </Button>

            {/* Info text */}
            <p className="mt-6 text-xs text-muted-foreground">
              You&apos;ll be prompted to use your device&apos;s biometrics
              (fingerprint, Face ID, etc.) or security key.
            </p>

            {/* Signed in as */}
            <div className="mt-8 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="mt-1 text-sm font-medium">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyPasskeyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function VerifyPasskeyPage() {
  return (
    <Suspense fallback={<VerifyPasskeyFallback />}>
      <VerifyPasskeyContent />
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












