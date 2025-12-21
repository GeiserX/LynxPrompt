"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  User,
  GraduationCap,
  Check,
  Save,
  ArrowRight,
  Link2,
  Github,
  Mail,
  Unlink,
  AlertCircle,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

const PERSONAS = [
  { value: "backend", label: "Backend Developer", icon: "🖥️" },
  { value: "frontend", label: "Frontend Developer", icon: "🎨" },
  { value: "fullstack", label: "Full-Stack Developer", icon: "🔄" },
  { value: "devops", label: "DevOps Engineer", icon: "⚙️" },
  { value: "dba", label: "Database Administrator", icon: "🗄️" },
  { value: "infrastructure", label: "Infrastructure Engineer", icon: "🏗️" },
  { value: "sre", label: "SRE", icon: "🔧" },
  { value: "mobile", label: "Mobile Developer", icon: "📱" },
  { value: "data", label: "Data Engineer", icon: "📊" },
  { value: "ml", label: "ML Engineer", icon: "🤖" },
];

const SKILL_LEVELS = [
  {
    value: "novice",
    label: "Novice",
    icon: "🌱",
    description:
      "New to this area - AI will be more verbose, explain concepts, and ask more clarifying questions",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: "🌿",
    description:
      "Comfortable with basics - AI gives balanced explanations, asks when needed",
  },
  {
    value: "senior",
    label: "Senior / Expert",
    icon: "🌳",
    description:
      "Deep expertise - AI is concise, assumes knowledge, minimal hand-holding",
  },
];

interface UserProfile {
  displayName: string | null;
  persona: string | null;
  skillLevel: string | null;
  profileCompleted: boolean;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface LinkedAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  createdAt: string;
}

interface AccountsData {
  accounts: LinkedAccount[];
  email: string | null;
  emailVerified: boolean;
}

// Wrapper component with Suspense for useSearchParams
export default function ProfileSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProfileSettingsContent />
    </Suspense>
  );
}

function ProfileSettingsContent() {
  const { status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [persona, setPersona] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  // Linked accounts state
  const [accountsData, setAccountsData] = useState<AccountsData | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
      fetchAccounts();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setDisplayName(data.displayName || data.name || "");
        setPersona(data.persona || "");
        setSkillLevel(data.skillLevel || "");
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/user/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccountsData(data);
      }
    } catch {
      console.error("Failed to load linked accounts");
    }
  };

  const handleLinkAccount = (provider: string) => {
    // Use NextAuth's signIn with callbackUrl to link account
    signIn(provider, { callbackUrl: "/settings/profile" });
  };

  const handleUnlinkAccount = async (provider: string) => {
    setUnlinking(provider);
    setError(null);

    try {
      const res = await fetch("/api/user/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unlink account");
      }

      await fetchAccounts();
      setSuccess(`${provider} account unlinked successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink account");
    } finally {
      setUnlinking(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return <Github className="h-5 w-5" />;
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "github":
        return "GitHub";
      case "google":
        return "Google";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const availableProviders = ["github", "google"];
  const linkedProviders = accountsData?.accounts.map((a) => a.provider) || [];
  const unlinkedProviders = availableProviders.filter(
    (p) => !linkedProviders.includes(p)
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          persona,
          skillLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setSuccess("Profile saved successfully!");

      // Refresh the session to get updated profileCompleted status
      await updateSession();

      // If onboarding and profile is now complete, redirect to wizard
      if (isOnboarding && updatedProfile.profileCompleted) {
        setTimeout(() => {
          router.push("/wizard");
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = displayName.trim() && persona && skillLevel;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to manage your profile.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            {!isOnboarding && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings/security">Security</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={isOnboarding ? "/" : "/dashboard"}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isOnboarding ? "Home" : "Dashboard"}
              </Link>
            </Button>
            {!isOnboarding && <UserMenu />}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Onboarding Header */}
          {isOnboarding && (
            <div className="mb-8 rounded-xl border bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 text-center">
              <h1 className="text-2xl font-bold">Welcome to LynxPrompt!</h1>
              <p className="mt-2 text-muted-foreground">
                Let&apos;s set up your profile. This helps us personalize your
                experience across all your projects.
              </p>
            </div>
          )}

          {/* Regular Header */}
          {!isOnboarding && (
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Profile Settings</h1>
                  <p className="text-muted-foreground">
                    Manage your developer profile and preferences
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              {success}
            </div>
          )}

          {/* Display Name */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Display Name</h2>
                <p className="text-sm text-muted-foreground">
                  This name will be used as the author when you download
                  templates
                </p>
              </div>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {profile?.image && (
              <p className="mt-3 text-sm text-muted-foreground">
                Your profile picture is pulled from your OAuth provider
                (GitHub/Google). To change it, use{" "}
                <a
                  href="https://gravatar.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gravatar
                </a>{" "}
                with your email: {profile.email}
              </p>
            )}
          </div>

          {/* Persona */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Developer Type</h2>
                <p className="text-sm text-muted-foreground">
                  What type of developer are you? This helps suggest relevant
                  options.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPersona(p.value)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary ${
                    persona === p.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="font-medium">{p.label}</span>
                  {persona === p.value && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Skill Level</h2>
                <p className="text-sm text-muted-foreground">
                  This controls how verbose the AI will be in generated configs
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSkillLevel(level.value)}
                  className={`flex w-full items-start gap-4 rounded-lg border p-5 text-left transition-all hover:border-primary ${
                    skillLevel === level.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : ""
                  }`}
                >
                  <span className="text-3xl">{level.icon}</span>
                  <div className="flex-1">
                    <span className="text-lg font-semibold">{level.label}</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                  {skillLevel === level.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid}
              className="flex-1"
              size="lg"
            >
              {saving ? (
                "Saving..."
              ) : isOnboarding ? (
                <>
                  Continue to Wizard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Profile
                </>
              )}
            </Button>
          </div>

          {!isFormValid && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Please fill in all fields to continue
            </p>
          )}

          {/* Account Linking Section - Only show when not onboarding */}
          {!isOnboarding && (
            <div className="mt-8 rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Link2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Linked Accounts</h2>
                  <p className="text-sm text-muted-foreground">
                    Connect multiple accounts to sign in with any of them
                  </p>
                </div>
              </div>

              {/* Current linked accounts */}
              <div className="space-y-3">
                {/* Email (Magic Link) */}
                {accountsData?.email && (
                  <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Email (Magic Link)</p>
                        <p className="text-sm text-muted-foreground">
                          {accountsData.email}
                        </p>
                      </div>
                    </div>
                    {accountsData.emailVerified ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        Unverified
                      </span>
                    )}
                  </div>
                )}

                {/* OAuth accounts */}
                {accountsData?.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        {getProviderIcon(account.provider)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getProviderLabel(account.provider)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Connected
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkAccount(account.provider)}
                      disabled={unlinking === account.provider}
                      className="text-destructive hover:text-destructive"
                    >
                      {unlinking === account.provider ? (
                        "Unlinking..."
                      ) : (
                        <>
                          <Unlink className="mr-2 h-4 w-4" />
                          Unlink
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Link new accounts */}
              {unlinkedProviders.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Link additional accounts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unlinkedProviders.map((provider) => (
                      <Button
                        key={provider}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkAccount(provider)}
                      >
                        {getProviderIcon(provider)}
                        <span className="ml-2">
                          Link {getProviderLabel(provider)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </footer>
    </div>
  );
}
