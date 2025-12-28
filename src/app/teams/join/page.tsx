"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import {
  Users,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
  Shield,
} from "lucide-react";

interface InvitationDetails {
  valid: boolean;
  status?: string;
  message?: string;
  teamName?: string;
  teamSlug?: string;
  memberCount?: number;
  invitedEmail?: string;
  role?: string;
  expiresAt?: string;
}

function JoinTeamContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/teams/invite/accept?token=${token}`);
      const data = await response.json();
      setInvitation(data);
    } catch (err) {
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation");
        return;
      }

      setSuccess(true);
      setJoinedTeam(data.team);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAccepting(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="teams" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            <p className="mt-2 text-muted-foreground">
              This invitation link is missing a token. Please check the link or
              ask your team administrator for a new invitation.
            </p>
            <Button asChild className="mt-6">
              <Link href="/teams">Learn About Teams</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="teams" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-500" />
            <p className="mt-4 text-muted-foreground">Loading invitation...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  if (success && joinedTeam) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="teams" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-teal-500/10 p-4">
                <Check className="h-8 w-8 text-teal-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Welcome to {joinedTeam.name}!</h1>
            <p className="mt-2 text-muted-foreground">
              You&apos;ve successfully joined the team. You now have access to all
              team features, including shared blueprints and premium wizards.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500"
                asChild
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/teams/${joinedTeam.slug}`}>View Team</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Invalid/expired invitation
  if (invitation && !invitation.valid) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="teams" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Invitation {invitation.status}</h1>
            <p className="mt-2 text-muted-foreground">{invitation.message}</p>
            <Button asChild className="mt-6">
              <Link href="/teams">Learn About Teams</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Valid invitation - show accept UI
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader currentPage="teams" />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-center gap-3">
                <Users className="h-8 w-8" />
                <h1 className="text-2xl font-bold">Team Invitation</h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-lg">
                  You&apos;ve been invited to join
                </p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  {invitation?.teamName}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Invited as</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Shield className="h-4 w-4 text-teal-500" />
                    {invitation?.role}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Team members</span>
                  <span className="font-medium">{invitation?.memberCount}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {invitation?.expiresAt
                      ? new Date(invitation.expiresAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Email mismatch warning */}
              {authStatus === "authenticated" &&
                session?.user?.email &&
                invitation?.invitedEmail &&
                session.user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase() && (
                  <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Email mismatch
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      This invitation was sent to{" "}
                      <strong>{invitation.invitedEmail}</strong>, but you&apos;re
                      signed in as <strong>{session.user.email}</strong>. You need
                      to sign in with the invited email to accept.
                    </p>
                  </div>
                )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {authStatus === "authenticated" ? (
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Accept Invitation
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                    asChild
                  >
                    <Link href={`/auth/signin?callbackUrl=/teams/join?token=${token}`}>
                      Sign In to Accept
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  By accepting, you agree to the team&apos;s policies and our{" "}
                  <Link href="/terms" className="text-teal-500 hover:underline">
                    Terms of Service
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="teams" />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-500" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <JoinTeamContent />
    </Suspense>
  );
}


