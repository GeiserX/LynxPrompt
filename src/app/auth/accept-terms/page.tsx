"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText, Shield } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AcceptTermsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsVersion: "2025-12",
          privacyVersion: "2025-12",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save consent");
      }

      // Redirect to dashboard after accepting
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-purple-600 to-pink-600 p-12 text-white lg:flex">
        <div className="w-fit rounded-xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
          <Logo />
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Almost there!{" "}
            <span className="text-white/80">One last step</span>
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Before you can start using LynxPrompt, please review and accept our
            terms and privacy policy.
          </p>

          <div className="mt-8 space-y-4">
            <Feature icon={<FileText className="h-4 w-4" />} text="Clear and transparent terms" />
            <Feature icon={<Shield className="h-4 w-4" />} text="Your data is protected" />
            <Feature icon={<CheckCircle2 className="h-4 w-4" />} text="GDPR compliant" />
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

      {/* Right side - Consent form */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <div className="w-fit rounded-lg bg-white dark:bg-black px-2 py-1.5">
            <Logo />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">Welcome to LynxPrompt!</h2>
              <p className="mt-2 text-muted-foreground">
                Hi {session?.user?.name || session?.user?.email?.split("@")[0]}! Please review and accept our policies to continue.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Terms of Service */}
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms-consent"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="terms-consent" className="flex-1">
                    <span className="font-medium text-foreground">
                      Terms of Service
                    </span>
                    <span className="text-destructive">*</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      I have read and agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>
                    </p>
                  </label>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy-consent"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="privacy-consent" className="flex-1">
                    <span className="font-medium text-foreground">
                      Privacy Policy
                    </span>
                    <span className="text-destructive">*</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      I have read and agree to the{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAccept}
              className="mt-8 w-full"
              disabled={!termsAccepted || !privacyAccepted || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to LynxPrompt"
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              You can review these policies anytime from your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}



