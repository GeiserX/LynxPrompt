"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PasskeyGuardProps {
  children: React.ReactNode;
}

/**
 * PasskeyGuard component that enforces passkey 2FA verification.
 * Wrap protected content with this component to require passkey verification
 * for users who have passkeys registered.
 *
 * Usage:
 * ```tsx
 * <PasskeyGuard>
 *   <YourProtectedContent />
 * </PasskeyGuard>
 * ```
 */
export function PasskeyGuard({ children }: PasskeyGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function checkPasskeyStatus() {
      // Wait for session to load
      if (status === "loading") return;

      // If not authenticated, let normal auth flow handle it
      if (status === "unauthenticated") {
        setChecking(false);
        setVerified(true); // Allow redirect to signin
        return;
      }

      // Check if passkey verification is required
      try {
        const res = await fetch("/api/auth/passkey-check");
        if (!res.ok) {
          // On error, allow access
          setVerified(true);
          setChecking(false);
          return;
        }

        const { required, verified: isVerified } = await res.json();

        if (required && !isVerified) {
          // Redirect to passkey verification
          const callbackUrl = encodeURIComponent(pathname);
          router.replace(`/auth/verify-passkey?callbackUrl=${callbackUrl}`);
          return;
        }

        setVerified(true);
      } catch (error) {
        console.error("Error checking passkey status:", error);
        // On error, allow access to avoid locking users out
        setVerified(true);
      } finally {
        setChecking(false);
      }
    }

    checkPasskeyStatus();
  }, [status, session, pathname, router]);

  // Show loading while checking
  if (checking || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not verified, we're being redirected
  if (!verified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}












