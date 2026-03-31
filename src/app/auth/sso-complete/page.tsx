"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function SSOCompleteContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const teamId = searchParams.get("teamId");
    const nonce = searchParams.get("nonce");
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const sig = searchParams.get("sig");

    if (!userId || !email || !teamId || !nonce || !sig) {
      setError("Invalid SSO completion parameters.");
      return;
    }

    // Sign in via NextAuth credentials provider with SSO params
    signIn("sso", {
      userId,
      email,
      teamId,
      nonce,
      sig,
      callbackUrl,
      redirect: true,
    }).catch(() => {
      setError("Failed to complete SSO sign-in. Please try again.");
    });
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <a href="/auth/signin" className="mt-4 inline-block text-primary hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Completing SSO sign-in...</p>
      </div>
    </div>
  );
}

export default function SSOCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SSOCompleteContent />
    </Suspense>
  );
}
