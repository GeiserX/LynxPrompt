"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  User,
  Shield,
  CreditCard,
  Key,
  Link2,
  Check,
  Save,
  ArrowLeft,
  GraduationCap,
  Github,
  Mail,
  Unlink,
  AlertCircle,
  Trash2,
  Plus,
  Smartphone,
  Laptop,
  Clock,
  ExternalLink,
  Star,
  Crown,
  Zap,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getGravatarUrl } from "@/lib/utils";
import { startRegistration } from "@simplewebauthn/browser";

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
    description: "New to this area - AI will be more verbose",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: "🌿",
    description: "Comfortable with basics",
  },
  {
    value: "senior",
    label: "Senior / Expert",
    icon: "🌳",
    description: "Deep expertise - AI is concise",
  },
];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "accounts", label: "Linked Accounts", icon: Link2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

interface UserProfile {
  displayName: string | null;
  persona: string | null;
  skillLevel: string | null;
  profileCompleted: boolean;
  name: string | null;
  email: string | null;
  image: string | null;
  isProfilePublic: boolean;
  showJobTitle: boolean;
  showSkillLevel: boolean;
}

interface LinkedAccount {
  id: string;
  provider: string;
  providerAccountId: string;
}

interface Passkey {
  id: string;
  name: string | null;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeSection, setActiveSection] = useState(
    searchParams.get("tab") || "profile"
  );

  // Profile state
  const [_profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [persona, setPersona] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [showJobTitle, setShowJobTitle] = useState(false);
  const [showSkillLevel, setShowSkillLevel] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  // Security state
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [registering, setRegistering] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData();
    }
  }, [status]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, accountsRes, passkeysRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/accounts"),
        fetch("/api/auth/passkey/list"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setDisplayName(data.displayName || data.name || "");
        setPersona(data.persona || "");
        setSkillLevel(data.skillLevel || "");
        setIsProfilePublic(data.isProfilePublic || false);
        setShowJobTitle(data.showJobTitle || false);
        setShowSkillLevel(data.showSkillLevel || false);
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
        setEmail(data.email);
        setEmailVerified(data.emailVerified);
      }

      if (passkeysRes.ok) {
        const data = await passkeysRes.json();
        setPasskeys(data);
      }
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Profile handlers
  const handleSaveProfile = async () => {
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
          isProfilePublic,
          showJobTitle,
          showSkillLevel,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      await updateSession();
      setSuccess("Profile saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Account handlers
  const handleLinkAccount = (provider: string) => {
    signIn(provider, { callbackUrl: "/settings?tab=accounts" });
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

      await fetchAllData();
      setSuccess(`${provider} account unlinked successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink account");
    } finally {
      setUnlinking(null);
    }
  };

  // Passkey handlers
  const registerPasskey = async () => {
    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error("Failed to get registration options");
      const options = await optionsRes.json();

      const attResp = await startRegistration(options);

      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attResp,
          name: passkeyName || "My Passkey",
        }),
      });

      if (!verifyRes.ok) throw new Error("Failed to verify registration");

      setSuccess("Passkey registered successfully!");
      setPasskeyName("");
      setShowNameInput(false);
      await fetchAllData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register passkey"
      );
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passkey?")) return;

    try {
      const res = await fetch("/api/auth/passkey/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccess("Passkey deleted successfully");
        await fetchAllData();
      } else {
        throw new Error("Failed to delete passkey");
      }
    } catch {
      setError("Failed to delete passkey");
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

  const getDeviceIcon = (type: string) => {
    if (type.includes("platform")) return <Laptop className="h-5 w-5" />;
    return <Smartphone className="h-5 w-5" />;
  };

  const linkedProviders = accounts.map((a) => a.provider);
  const availableProviders = ["github", "google"];
  const unlinkedProviders = availableProviders.filter(
    (p) => !linkedProviders.includes(p)
  );

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
            Please sign in to manage your settings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const avatarUrl =
    session?.user?.image ||
    (session?.user?.email
      ? getGravatarUrl(session.user.email, 96)
      : undefined);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block">
          <div className="sticky top-16 p-6">
            {/* User Info */}
            <div className="mb-6 flex items-center gap-3">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    router.push(`/settings?tab=${section.id}`);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-2xl">
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

            {/* Mobile Section Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    router.push(`/settings?tab=${section.id}`);
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm ${
                    activeSection === section.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Profile</h1>
                  <p className="text-muted-foreground">
                    Manage your developer profile and preferences
                  </p>
                </div>

                {/* Display Name */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Display Name</h2>
                      <p className="text-sm text-muted-foreground">
                        Used as the author when you download blueprints
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
                </div>

                {/* Persona */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Developer Type</h2>
                      <p className="text-sm text-muted-foreground">
                        Helps suggest relevant options
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPersona(p.value)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary ${
                          persona === p.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : ""
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-sm font-medium">{p.label}</span>
                        {persona === p.value && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill Level */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Skill Level</h2>
                      <p className="text-sm text-muted-foreground">
                        Controls AI verbosity in generated configs
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {SKILL_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setSkillLevel(level.value)}
                        className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary ${
                          skillLevel === level.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : ""
                        }`}
                      >
                        <span className="text-2xl">{level.icon}</span>
                        <div className="flex-1">
                          <span className="font-semibold">{level.label}</span>
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

                {/* Public Profile Settings */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Public Profile</h2>
                      <p className="text-sm text-muted-foreground">
                        Control what others can see when they click on your name
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {/* Make profile public */}
                    <label className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:border-primary">
                      <input
                        type="checkbox"
                        checked={isProfilePublic}
                        onChange={(e) => setIsProfilePublic(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Make profile public</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Allow others to view your profile page and your public blueprints. 
                          Private blueprints are never shared.
                        </p>
                      </div>
                    </label>

                    {/* Show job title */}
                    <label className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:border-primary ${!isProfilePublic ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={showJobTitle}
                        onChange={(e) => setShowJobTitle(e.target.checked)}
                        disabled={!isProfilePublic}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Show developer type</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Display your job title/developer type on your public profile
                        </p>
                      </div>
                    </label>

                    {/* Show skill level */}
                    <label className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:border-primary ${!isProfilePublic ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={showSkillLevel}
                        onChange={(e) => setShowSkillLevel(e.target.checked)}
                        disabled={!isProfilePublic}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Show skill level</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Display your expertise level on your public profile
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !isFormValid}
                  className="w-full"
                  size="lg"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Accounts Section */}
            {activeSection === "accounts" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Linked Accounts</h1>
                  <p className="text-muted-foreground">
                    Connect multiple accounts to sign in with any of them
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  {/* Email (Magic Link) */}
                  {email && (
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Email (Magic Link)</p>
                          <p className="text-sm text-muted-foreground">
                            {email}
                          </p>
                        </div>
                      </div>
                      {emailVerified ? (
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
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="mt-3 flex items-center justify-between rounded-lg border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          {getProviderIcon(account.provider)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {account.provider.charAt(0).toUpperCase() +
                              account.provider.slice(1)}
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
                              Link{" "}
                              {provider.charAt(0).toUpperCase() +
                                provider.slice(1)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Security</h1>
                  <p className="text-muted-foreground">
                    Manage your passkeys and security options
                  </p>
                </div>

                {/* Passkeys */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Passkeys</h2>
                      <p className="text-sm text-muted-foreground">
                        Passwordless authentication using biometrics
                      </p>
                    </div>
                  </div>

                  {passkeys.length > 0 ? (
                    <div className="mb-6 space-y-3">
                      {passkeys.map((passkey) => (
                        <div
                          key={passkey.id}
                          className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
                        >
                          <div className="flex items-center gap-3">
                            {getDeviceIcon(passkey.credentialDeviceType)}
                            <div>
                              <p className="font-medium">
                                {passkey.name || "Passkey"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Created{" "}
                                  {new Date(
                                    passkey.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {passkey.credentialBackedUp && (
                                  <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-600">
                                    Backed up
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePasskey(passkey.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-6 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                      <Key className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No passkeys registered yet
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add a passkey for faster, more secure sign-in
                      </p>
                    </div>
                  )}

                  {showNameInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={passkeyName}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        placeholder="Passkey name (e.g., MacBook Pro)"
                        className="flex-1 rounded-lg border bg-background px-3 py-2"
                        autoFocus
                      />
                      <Button onClick={registerPasskey} disabled={registering}>
                        {registering ? "Registering..." : "Register"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowNameInput(false);
                          setPasskeyName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowNameInput(true)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Passkey
                    </Button>
                  )}
                </div>

                {/* Account Info */}
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="mb-4 font-semibold">Account Information</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{session?.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {session?.user?.role || "USER"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === "billing" && (
              <BillingSection error={error} setError={setError} success={success} setSuccess={setSuccess} />
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

// Billing Section Component
interface BillingSectionProps {
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
}

interface SubscriptionStatus {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeAccount: boolean;
  hasActiveSubscription: boolean;
  isAdmin?: boolean;
  pendingChange?: string | null;
}

const PLAN_DETAILS = {
  free: {
    name: "Free",
    description: "Basic features for getting started",
    price: "€0",
    icon: Star,
    color: "text-muted-foreground",
  },
  pro: {
    name: "Pro",
    description: "For developers who want more powerful configuration options",
    price: "€5/month",
    icon: Zap,
    color: "text-primary",
  },
  max: {
    name: "Max",
    description: "Full access to everything, including all paid community blueprints",
    price: "€20/month",
    icon: Crown,
    color: "text-purple-500",
  },
};

function BillingSection({ setError, setSuccess }: BillingSectionProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [euConsent, setEuConsent] = useState(false);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      setError("Failed to load subscription info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlanChange = async (plan: string) => {
    setUpgrading(plan);
    setError(null);

    try {
      // If user has active subscription, use change-plan API
      if (subscription?.hasActiveSubscription) {
        const res = await fetch("/api/billing/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to change plan");
        }

        // Show success message based on upgrade/downgrade
        if (data.type === "upgrade") {
          setSuccess(`Upgraded to ${plan.toUpperCase()}! Changes are effective immediately.`);
        } else if (data.type === "downgrade") {
          const effectiveDate = new Date(data.effectiveDate).toLocaleDateString();
          setSuccess(`Downgrade to ${plan.toUpperCase()} scheduled. You'll keep your current plan until ${effectiveDate}.`);
        }

        // Refresh subscription status
        await fetchSubscription();
      } else {
        // No active subscription, use checkout
        // Check EU consent first
        if (!euConsent) {
          throw new Error("Please accept the terms to proceed with your subscription.");
        }

        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, euDigitalContentConsent: euConsent }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create checkout session");
        }

        const { url } = await res.json();
        if (url) {
          window.location.href = url;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to open billing portal");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const planInfo = PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
  const PlanIcon = planInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Current Plan</h2>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg bg-muted p-2 ${planInfo.color}`}>
              <PlanIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{planInfo.name}</p>
                {subscription?.isAdmin && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription?.isAdmin 
                  ? "Full access granted as administrator"
                  : planInfo.description}
              </p>
              {!subscription?.isAdmin && subscription?.currentPeriodEnd && subscription.status === "active" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {subscription?.isAdmin ? "Free" : planInfo.price}
            </p>
            {!subscription?.isAdmin && subscription?.status && subscription.status !== "active" && (
              <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600">
                {subscription.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pending Downgrade Notice */}
      {subscription?.pendingChange && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                Downgrade Scheduled
              </p>
              <p className="text-sm text-muted-foreground">
                Your plan will change to {subscription.pendingChange.toUpperCase()} at the end of your billing period
                {subscription.currentPeriodEnd && ` (${new Date(subscription.currentPeriodEnd).toLocaleDateString()})`}.
                You&apos;ll keep {currentPlan.toUpperCase()} access until then.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EU Digital Content Consent - Only for new subscriptions */}
      {currentPlan !== "max" && !subscription?.isAdmin && !subscription?.hasActiveSubscription && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="euConsent"
              checked={euConsent}
              onChange={(e) => setEuConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="euConsent" className="text-sm text-muted-foreground">
              I consent to immediate access to digital content and acknowledge that I lose my right to 
              withdraw from this purchase within 14 days once I access the subscription features.
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
        </div>
      )}

      {/* Upgrade Options - Hide for admins (they already have MAX) */}
      {currentPlan !== "max" && !subscription?.isAdmin && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Upgrade Your Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {currentPlan === "free" && (
              <button
                onClick={() => handlePlanChange("pro")}
                disabled={upgrading === "pro" || (!subscription?.hasActiveSubscription && !euConsent)}
                className="flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Pro</p>
                  <p className="text-sm text-muted-foreground">€5/month</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Intermediate wizards, sell blueprints (70% revenue)
                  </p>
                </div>
                <Button size="sm" disabled={!!upgrading || (!subscription?.hasActiveSubscription && !euConsent)}>
                  {upgrading === "pro" ? "..." : "Upgrade"}
                </Button>
              </button>
            )}
            <button
              onClick={() => handlePlanChange("max")}
              disabled={upgrading === "max" || (!subscription?.hasActiveSubscription && !euConsent)}
              className="flex items-start gap-4 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-4 text-left transition-all hover:border-purple-500 hover:from-purple-500/10 hover:to-pink-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2 text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text font-semibold text-transparent">
                  Max
                </p>
                <p className="text-sm text-muted-foreground">€20/month</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  All features + access to ALL paid blueprints
                </p>
                {currentPlan === "pro" && subscription?.hasActiveSubscription && (
                  <p className="mt-1 text-xs text-green-600">
                    Unused Pro credit will be applied
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                disabled={!!upgrading || (!subscription?.hasActiveSubscription && !euConsent)}
              >
                {upgrading === "max" ? "..." : "Upgrade"}
              </Button>
            </button>
          </div>
        </div>
      )}

      {/* Downgrade Option - Only for Max users with active subscription */}
      {currentPlan === "max" && !subscription?.isAdmin && subscription?.hasActiveSubscription && !subscription?.pendingChange && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Downgrade Plan</h2>
          <button
            onClick={() => handlePlanChange("pro")}
            disabled={upgrading === "pro"}
            className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-muted/50"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Downgrade to Pro</p>
              <p className="text-sm text-muted-foreground">€5/month</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Takes effect at the end of your billing period. You&apos;ll keep Max access until then.
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={!!upgrading}>
              {upgrading === "pro" ? "..." : "Downgrade"}
            </Button>
          </button>
        </div>
      )}

      {/* Manage Subscription */}
      {subscription?.hasStripeAccount && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Manage Subscription</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Update payment methods, view invoices, or cancel your subscription
            through the Stripe customer portal.
          </p>
          <Button
            onClick={handleManageBilling}
            disabled={openingPortal}
            variant="outline"
          >
            {openingPortal ? (
              "Opening..."
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Billing Portal
              </>
            )}
          </Button>
        </div>
      )}

      {/* No Stripe Account */}
      {!subscription?.hasStripeAccount && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Payment Methods</h2>
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No payment methods added
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a payment method when you upgrade to a paid plan
            </p>
          </div>
        </div>
      )}

      {/* Billing Info */}
      <div className="rounded-lg border border-muted/50 bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Secure payments by Stripe.</strong> We never store your card details.
          All subscriptions are billed monthly and can be canceled anytime.
          Prices are in EUR and include VAT where applicable.
        </p>
      </div>
    </div>
  );
}




