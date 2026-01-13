"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Users,
  Settings,
  Mail,
  Crown,
  UserPlus,
  Trash2,
  Loader2,
  ArrowLeft,
  Building2,
  CreditCard,
  Copy,
  Check,
  Camera,
  ImageIcon,
} from "lucide-react";
import { SSOConfigPanel } from "@/components/sso-config";

interface TeamMember {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  lastActiveAt: string | null;
  isActiveThisCycle: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    displayName: string | null;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expires: string;
  expiresAt?: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  maxSeats: number;
  subscriptionInterval: "monthly" | "annual" | null;
  aiUsageLimitPerUser: number;
  createdAt: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  _count: {
    members: number;
  };
}

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER" | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && slug) {
      fetchTeam();
    }
  }, [status, slug]);

  const fetchTeam = async () => {
    try {
      // First get billing status to find team ID
      const billingRes = await fetch("/api/billing/status");
      const billingData = await billingRes.json();

      if (!billingData.isTeamsUser || !billingData.team) {
        setError("You are not part of any team");
        setLoading(false);
        return;
      }

      if (billingData.team.slug !== slug) {
        setError("Team not found");
        setLoading(false);
        return;
      }

      const teamId = billingData.team.id;
      setUserRole(billingData.team.role);

      // Fetch full team details
      const teamRes = await fetch(`/api/teams/${teamId}`);
      if (!teamRes.ok) {
        throw new Error("Failed to fetch team");
      }
      const teamData = await teamRes.json();
      setTeam(teamData.team);

      // Fetch members
      const membersRes = await fetch(`/api/teams/${teamId}/members`);
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeam(prev => prev ? { ...prev, members: membersData.members } : null);
      }

      // Fetch invitations (admin only)
      if (billingData.team.role === "ADMIN") {
        const invitesRes = await fetch(`/api/teams/${teamId}/invitations`);
        if (invitesRes.ok) {
          const invitesData = await invitesRes.json();
          setTeam(prev => prev ? { ...prev, invitations: invitesData.invitations } : null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    additionalSeatsNeeded: number;
    pendingEmail: string;
  } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    setShowPaymentPrompt(false);

    try {
      const res = await fetch(`/api/teams/${team.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (res.status === 402 && data.code === "SEATS_REQUIRED") {
        // Need to purchase additional seat
        setPaymentDetails({
          additionalSeatsNeeded: data.details.additionalSeatsNeeded,
          pendingEmail: inviteEmail,
        });
        setShowPaymentPrompt(true);
        setInviting(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchTeam(); // Refresh team data
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handlePurchaseSeats = async () => {
    if (!team || !paymentDetails) return;
    
    // Redirect to billing page to add seats
    // After seat increase, they can retry the invitation
    const newSeats = (team.maxSeats || 3) + paymentDetails.additionalSeatsNeeded;
    router.push(`/teams/${team.slug}?tab=billing&seats=${newSeats}`);
  };

  const handleCopyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/teams/join?token=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team || !confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`/api/teams/${team.id}/members?memberId=${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!team || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    setLogoError(null);
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/teams/${team.id}/logo`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload logo");
      }

      // Refresh team data to get new logo URL
      fetchTeam();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!team || !confirm("Remove team logo?")) return;

    try {
      const res = await fetch(`/api/teams/${team.id}/logo`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove logo");
      }

      fetchTeam();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Failed to remove logo");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Logo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Team Header */}
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Team Logo */}
              <div className="relative group">
                {team?.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="h-16 w-16 rounded-xl object-contain bg-muted"
                    style={{ maxWidth: "64px", maxHeight: "64px" }}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                {userRole === "ADMIN" && (
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    {uploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{team?.name}</h1>
                <p className="text-muted-foreground">
                  {team?._count?.members || team?.members?.length || 0} members • {team?.maxSeats} max seats
                </p>
                {logoError && (
                  <p className="text-sm text-red-500">{logoError}</p>
                )}
              </div>
            </div>
            {userRole === "ADMIN" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                <Crown className="h-4 w-4" />
                Admin
              </span>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Members Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Team Members */}
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5 text-teal-500" />
                    Team Members
                  </h2>
                </div>

                <div className="space-y-3">
                  {team?.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {(member.user.displayName || member.user.name || member.user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.displayName || member.user.name || member.user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === "ADMIN" && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                            Admin
                          </span>
                        )}
                        {member.isActiveThisCycle && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Active
                          </span>
                        )}
                        {userRole === "ADMIN" && member.user.id !== session?.user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Invitations (Admin only) */}
              {userRole === "ADMIN" && team?.invitations && team.invitations.length > 0 && (
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Mail className="h-5 w-5 text-amber-500" />
                    Pending Invitations
                  </h2>

                  <div className="space-y-3">
                    {team.invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between rounded-lg border border-dashed p-3"
                      >
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {new Date(invite.expires).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyInviteLink(invite.id)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-muted"
                        >
                          {copiedLink === invite.id ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Invite Member (Admin only) */}
              {userRole === "ADMIN" && (
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <UserPlus className="h-5 w-5 text-teal-500" />
                    Invite Member
                  </h2>

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    {inviteError && (
                      <p className="text-sm text-red-500">{inviteError}</p>
                    )}
                    {inviteSuccess && (
                      <p className="text-sm text-green-500">{inviteSuccess}</p>
                    )}
                    
                    {showPaymentPrompt && paymentDetails && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                        <p className="mb-3 text-sm text-amber-800 dark:text-amber-200">
                          You need to purchase {paymentDetails.additionalSeatsNeeded} additional seat{paymentDetails.additionalSeatsNeeded > 1 ? "s" : ""} to invite <strong>{paymentDetails.pendingEmail}</strong>.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handlePurchaseSeats}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Purchase Seat ({team?.subscriptionInterval === "annual" ? "€9/seat (annual)" : "€10/seat"})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPaymentPrompt(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {!showPaymentPrompt && (
                      <Button type="submit" disabled={inviting} className="w-full">
                        {inviting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    )}
                  </form>
                </div>
              )}

              {/* Quick Stats */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-5 w-5 text-teal-500" />
                  Plan Details
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium text-teal-600 dark:text-teal-400">Teams</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing</span>
                    <span className="font-medium capitalize">
                      {team?.subscriptionInterval || "monthly"}
                      {team?.subscriptionInterval === "annual" && (
                        <span className="ml-1 text-xs text-teal-600 dark:text-teal-400">(10% off)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Seats</span>
                    <span className="font-medium">{team?.maxSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Members</span>
                    <span className="font-medium">{team?.members?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Seats</span>
                    <span className="font-medium">
                      {Math.max(0, (team?.maxSeats || 0) - (team?.members?.length || 0) - (team?.invitations?.filter(i => i.status === "PENDING")?.length || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* SSO Settings (Admin only) */}
              {userRole === "ADMIN" && team?.id && (
                <SSOConfigPanel teamId={team.id} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

