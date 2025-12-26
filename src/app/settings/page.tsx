"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  User,
  Users,
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
  Variable,
  X,
  FileCode,
  Pencil,
  Loader2,
  Camera,
  ImageIcon,
  Code,
  Copy,
  Eye,
  EyeOff,
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
  { id: "variables", label: "Saved Variables", icon: Variable },
  { id: "files", label: "Saved Files", icon: FileCode },
  { id: "accounts", label: "Linked Accounts", icon: Link2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "api-tokens", label: "API Tokens", icon: Code },
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
  socialGithub: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialWebsite: string | null;
  socialYoutube: string | null;
  socialBluesky: string | null;
  socialMastodon: string | null;
  socialDiscord: string | null;
}

interface LinkedAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  providerEmail: string | null;
  providerUsername: string | null;
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
  const [socialGithub, setSocialGithub] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialBluesky, setSocialBluesky] = useState("");
  const [socialMastodon, setSocialMastodon] = useState("");
  const [socialDiscord, setSocialDiscord] = useState("");

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
  
  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

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
        setSocialGithub(data.socialGithub || "");
        setSocialTwitter(data.socialTwitter || "");
        setSocialLinkedin(data.socialLinkedin || "");
        setSocialWebsite(data.socialWebsite || "");
        setSocialYoutube(data.socialYoutube || "");
        setSocialBluesky(data.socialBluesky || "");
        setSocialMastodon(data.socialMastodon || "");
        setSocialDiscord(data.socialDiscord || "");
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
          socialGithub,
          socialTwitter,
          socialLinkedin,
          socialWebsite,
          socialYoutube,
          socialBluesky,
          socialMastodon,
          socialDiscord,
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

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side first
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File too large. Maximum size is 2MB");
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      await updateSession();
      setSuccess("Profile picture uploaded successfully!");
      // Refresh the page to show new avatar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      // Reset the file input
      e.target.value = "";
    }
  };

  // Avatar delete handler
  const handleAvatarDelete = async () => {
    if (!confirm("Remove your profile picture?")) return;

    setDeletingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/profile/avatar", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove avatar");
      }

      await updateSession();
      setSuccess("Profile picture removed!");
      // Refresh the page to update avatar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setDeletingAvatar(false);
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

                {/* Profile Picture */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Profile Picture</h2>
                      <p className="text-sm text-muted-foreground">
                        Upload a custom profile picture (max 2MB)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Current Avatar */}
                    <div className="relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="h-24 w-24 rounded-full object-cover ring-2 ring-muted"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted ring-2 ring-muted">
                          <User className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      {/* Upload Overlay Button */}
                      <label
                        className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100 ${
                          uploadingAvatar ? "opacity-100 cursor-wait" : ""
                        }`}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <label
                        className={`inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${
                          uploadingAvatar ? "cursor-wait opacity-50" : ""
                        }`}
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Upload New
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                      {session?.user?.image && session.user.image.startsWith("/api/user/profile/avatar") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarDelete}
                          disabled={deletingAvatar}
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        >
                          {deletingAvatar ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </>
                          )}
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, GIF, or WebP
                      </p>
                    </div>
                  </div>
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
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsProfilePublic(checked);
                          // Auto-enable child options when making profile public
                          if (checked) {
                            setShowJobTitle(true);
                            setShowSkillLevel(true);
                          }
                        }}
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

                    {/* Nested child options */}
                    <div className={`ml-6 space-y-3 border-l-2 pl-4 ${!isProfilePublic ? 'opacity-40 pointer-events-none' : 'border-primary/30'}`}>
                      {/* Show job title */}
                      <label className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:border-primary">
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
                      <label className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-all hover:border-primary">
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
                </div>

                {/* Social Links Section */}
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold">Social Links</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Add your social profiles to display on your public profile page
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* GitHub */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        GitHub
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          github.com/
                        </span>
                        <input
                          type="text"
                          value={socialGithub}
                          onChange={(e) => setSocialGithub(e.target.value.replace(/^@/, ""))}
                          placeholder="username"
                          className="w-full rounded-lg border bg-background py-2 pl-28 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Twitter/X */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Twitter / X
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          x.com/
                        </span>
                        <input
                          type="text"
                          value={socialTwitter}
                          onChange={(e) => setSocialTwitter(e.target.value.replace(/^@/, ""))}
                          placeholder="username"
                          className="w-full rounded-lg border bg-background py-2 pl-16 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        LinkedIn
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          linkedin.com/in/
                        </span>
                        <input
                          type="text"
                          value={socialLinkedin}
                          onChange={(e) => setSocialLinkedin(e.target.value)}
                          placeholder="username"
                          className="w-full rounded-lg border bg-background py-2 pl-32 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Bluesky */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Bluesky
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          @
                        </span>
                        <input
                          type="text"
                          value={socialBluesky}
                          onChange={(e) => setSocialBluesky(e.target.value.replace(/^@/, ""))}
                          placeholder="handle.bsky.social"
                          className="w-full rounded-lg border bg-background py-2 pl-8 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        YouTube
                      </label>
                      <input
                        type="url"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        placeholder="https://youtube.com/@channel"
                        className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Mastodon */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Mastodon
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          @
                        </span>
                        <input
                          type="text"
                          value={socialMastodon}
                          onChange={(e) => setSocialMastodon(e.target.value.replace(/^@/, ""))}
                          placeholder="user@mastodon.social"
                          className="w-full rounded-lg border bg-background py-2 pl-8 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Discord */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Discord
                      </label>
                      <input
                        type="text"
                        value={socialDiscord}
                        onChange={(e) => setSocialDiscord(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Website
                      </label>
                      <input
                        type="url"
                        value={socialWebsite}
                        onChange={(e) => setSocialWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
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

            {/* Variables Section */}
            {activeSection === "variables" && (
              <SavedVariablesSection />
            )}

            {/* Files Section */}
            {activeSection === "files" && (
              <SavedFilesSection />
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
                  {accounts.map((account) => {
                    // Determine the display identifier for the account
                    let accountIdentifier: string | null = null;
                    if (account.provider === "github" && account.providerUsername) {
                      accountIdentifier = `@${account.providerUsername}`;
                    } else if (account.provider === "google" && account.providerEmail) {
                      accountIdentifier = account.providerEmail;
                    }
                    
                    return (
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
                              {accountIdentifier || "Connected"}
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
                    );
                  })}

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

            {/* API Tokens Section */}
            {activeSection === "api-tokens" && (
              <ApiTokensSection error={error} setError={setError} success={success} setSuccess={setSuccess} />
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
  interval?: "monthly" | "annual";
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeAccount: boolean;
  hasActiveSubscription: boolean;
  isAdmin?: boolean;
  pendingChange?: string | null;
  isAnnual?: boolean;
}

interface SellerEarnings {
  totalEarnings: number;
  totalSales: number;
  availableBalance: number;
  pendingPayoutAmount: number;
  completedPayoutAmount: number;
  paypalEmail: string | null;
  minimumPayout: number;
  currency: string;
}

interface PayoutHistory {
  id: string;
  amount: number;
  currency: string;
  paypalEmail: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
}

const PLAN_DETAILS = {
  free: {
    name: "Free",
    description: "Basic features for getting started",
    price: "€0",
    priceAnnual: "€0",
    icon: Star,
    color: "text-muted-foreground",
  },
  pro: {
    name: "Pro",
    description: "For developers who want more powerful configuration options",
    price: "€5/month",
    priceAnnual: "€54/year",
    icon: Zap,
    color: "text-primary",
  },
  max: {
    name: "Max",
    description: "Full access to everything, including all paid community blueprints",
    price: "€20/month",
    priceAnnual: "€216/year",
    icon: Crown,
    color: "text-purple-500",
  },
  teams: {
    name: "Teams",
    description: "Team collaboration with shared blueprints and enterprise SSO",
    price: "€30/seat/month",
    priceAnnual: "€30/seat/month",
    icon: Users,
    color: "text-teal-500",
  },
};

function BillingSection({ setError, setSuccess }: BillingSectionProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [euConsent, setEuConsent] = useState(false);
  
  // Seller payout state
  const [earnings, setEarnings] = useState<SellerEarnings | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [showPayoutHistory, setShowPayoutHistory] = useState(false);

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

  const fetchEarnings = async () => {
    setLoadingEarnings(true);
    try {
      const [earningsRes, historyRes] = await Promise.all([
        fetch("/api/seller/earnings"),
        fetch("/api/seller/payout-request"),
      ]);
      
      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setEarnings(data);
        setPaypalEmail(data.paypalEmail || "");
      }
      
      if (historyRes.ok) {
        const data = await historyRes.json();
        setPayoutHistory(data.payouts || []);
      }
    } catch {
      // Non-fatal - seller section just won't show data
    } finally {
      setLoadingEarnings(false);
    }
  };

  const handleSavePaypalEmail = async () => {
    setSavingPaypal(true);
    setError(null);
    
    try {
      const res = await fetch("/api/seller/payout-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail: paypalEmail.trim() }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save PayPal email");
      }
      
      setSuccess("PayPal email saved successfully!");
      await fetchEarnings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PayPal email");
    } finally {
      setSavingPaypal(false);
    }
  };

  const handleRequestPayout = async () => {
    setRequestingPayout(true);
    setError(null);
    
    try {
      const res = await fetch("/api/seller/payout-request", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to request payout");
      }
      
      setSuccess(`Payout of €${(data.payout.amount / 100).toFixed(2)} requested successfully! We'll process it within 5 business days.`);
      await fetchEarnings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request payout");
    } finally {
      setRequestingPayout(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlanChange = async (plan: string) => {
    setUpgrading(plan);
    setError(null);

    try {
      // If user has active subscription, use change-plan API
      if (subscription?.hasActiveSubscription) {
        // Determine if this is an upgrade (Pro → Max)
        const planOrder: Record<string, number> = { free: 0, pro: 1, max: 2, teams: 3 };
        const isUpgrade = planOrder[plan] > planOrder[currentPlan];

        // EU Digital Content Directive: require consent for upgrades (gaining new digital content)
        if (isUpgrade && !euConsent) {
          throw new Error("Please accept the terms to proceed with your upgrade.");
        }

        const res = await fetch("/api/billing/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, euDigitalContentConsent: isUpgrade ? euConsent : undefined }),
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
                  {subscription?.isAnnual && !subscription.cancelAtPeriodEnd && (
                    <span className="ml-1">(Annual commitment)</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {subscription?.isAdmin ? "Free" : (subscription?.isAnnual ? planInfo.priceAnnual : planInfo.price)}
            </p>
            {!subscription?.isAdmin && subscription?.isAnnual && (
              <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                Annual (10% off)
              </span>
            )}
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

      {/* EU Digital Content Consent - Required for new subscriptions AND upgrades (not for Teams, Max users, or admins) */}
      {currentPlan !== "max" && currentPlan !== "teams" && !subscription?.isAdmin && !subscription?.isTeamsUser && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="euConsent"
              checked={euConsent}
              onChange={(e) => setEuConsent(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />
            <label htmlFor="euConsent" className="cursor-pointer text-sm text-muted-foreground">
              I consent to immediate access to digital content and acknowledge that I lose my right to 
              withdraw from this purchase within 14 days once I access the subscription features.
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
        </div>
      )}

      {/* Upgrade Options - Hide for admins (they already have MAX), Max users, and Teams users (billing at team level) */}
      {currentPlan !== "max" && currentPlan !== "teams" && !subscription?.isAdmin && !subscription?.isTeamsUser && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Upgrade Your Plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {currentPlan === "free" && (
              <button
                onClick={() => handlePlanChange("pro")}
                disabled={upgrading === "pro" || !euConsent}
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
                <Button size="sm" disabled={!!upgrading || !euConsent}>
                  {upgrading === "pro" ? "..." : "Upgrade"}
                </Button>
              </button>
            )}
            <button
              onClick={() => handlePlanChange("max")}
              disabled={upgrading === "max" || !euConsent}
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
                disabled={!!upgrading || !euConsent}
              >
                {upgrading === "max" ? "..." : "Upgrade"}
              </Button>
            </button>
          </div>
        </div>
      )}

      {/* Teams Plan Info - Only for Teams users */}
      {subscription?.isTeamsUser && subscription?.team && (
        <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 p-2 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Team: {subscription.team.name}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {subscription.team.role === "ADMIN" ? "Administrator" : "Member"}
                </p>
              </div>
            </div>
            <Link
              href={`/teams/${subscription.team.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-500/30 px-4 py-2 text-sm font-medium text-teal-600 transition-colors hover:bg-teal-500/10 dark:text-teal-400"
            >
              <Users className="h-4 w-4" />
              {subscription.team.role === "ADMIN" ? "Manage Team" : "View Team"}
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Your subscription is managed at the team level. {subscription.team.role === "ADMIN" 
              ? "You can manage members and billing from the team page." 
              : "Contact your team admin for billing inquiries."}
          </p>
        </div>
      )}

      {/* Downgrade Option - Only for Max users with active subscription (not Teams) */}
      {currentPlan === "max" && !subscription?.isAdmin && !subscription?.isTeamsUser && subscription?.hasActiveSubscription && !subscription?.pendingChange && (
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
          Monthly subscriptions can be canceled anytime. Annual subscriptions commit for the full year 
          and cannot be canceled mid-cycle (you keep access until the period ends).
          Prices are in EUR and include VAT where applicable.
        </p>
      </div>

      {/* Seller Payouts Section - Only for Pro/Max users who can sell */}
      {(subscription?.plan === "pro" || subscription?.plan === "max" || subscription?.isAdmin) && (
        <div className="mt-8 space-y-6 border-t pt-8">
          <div>
            <h1 className="text-2xl font-bold">Seller Payouts</h1>
            <p className="text-muted-foreground">
              Manage earnings from your blueprint sales
            </p>
          </div>

          {/* Earnings Overview */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">Earnings Overview</h2>
            {loadingEarnings ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : earnings ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{(earnings.totalEarnings / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from {earnings.totalSales} sales
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">
                    €{(earnings.availableBalance / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ready for payout
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    €{(earnings.completedPayoutAmount / 100).toFixed(2)}
                  </p>
                  {earnings.pendingPayoutAmount > 0 && (
                    <p className="text-xs text-yellow-600">
                      €{(earnings.pendingPayoutAmount / 100).toFixed(2)} pending
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No earnings data available
              </p>
            )}
          </div>

          {/* PayPal Configuration */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">Payout Settings</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Configure your PayPal email to receive payouts from blueprint sales.
              We send payouts via PayPal within 5 business days of your request.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="your.paypal@email.com"
                className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleSavePaypalEmail}
                disabled={savingPaypal || !paypalEmail.trim()}
              >
                {savingPaypal ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Important: Use the email associated with your PayPal account.
            </p>
          </div>

          {/* Request Payout */}
          {earnings && earnings.paypalEmail && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold">Request Payout</h2>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div>
                  <p className="font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{(earnings.availableBalance / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Minimum payout: €{(earnings.minimumPayout / 100).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    requestingPayout ||
                    earnings.availableBalance < earnings.minimumPayout ||
                    earnings.pendingPayoutAmount > 0
                  }
                >
                  {requestingPayout ? (
                    "Requesting..."
                  ) : earnings.pendingPayoutAmount > 0 ? (
                    "Payout Pending"
                  ) : (
                    "Request Payout"
                  )}
                </Button>
              </div>
              {earnings.availableBalance < earnings.minimumPayout && earnings.availableBalance > 0 && (
                <p className="mt-2 text-sm text-yellow-600">
                  You need €{((earnings.minimumPayout - earnings.availableBalance) / 100).toFixed(2)} more to reach the minimum payout amount.
                </p>
              )}
            </div>
          )}

          {/* Payout History */}
          {payoutHistory.length > 0 && (
            <div className="rounded-xl border bg-card p-6">
              <button
                onClick={() => setShowPayoutHistory(!showPayoutHistory)}
                className="flex w-full items-center justify-between"
              >
                <h2 className="font-semibold">Payout History</h2>
                <span className="text-sm text-muted-foreground">
                  {showPayoutHistory ? "Hide" : "Show"} ({payoutHistory.length})
                </span>
              </button>
              
              {showPayoutHistory && (
                <div className="mt-4 space-y-3">
                  {payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                    >
                      <div>
                        <p className="font-medium">
                          €{(payout.amount / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.requestedAt).toLocaleDateString()} → {payout.paypalEmail}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          payout.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-600"
                            : payout.status === "PENDING" || payout.status === "PROCESSING"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : payout.status === "FAILED"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seller Info */}
          <div className="rounded-lg border border-muted/50 bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Revenue split:</strong> You receive 70% of each blueprint sale.
              LynxPrompt retains 30% as a platform fee.
              Payouts are processed via PayPal within 5 business days after request.
              Minimum payout is €10.00.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Saved Variables Section Component
interface SavedVariable {
  key: string;
  value: string;
}

function SavedVariablesSection() {
  const [variables, setVariables] = useState<SavedVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchVariables = async () => {
    try {
      const res = await fetch("/api/user/variables");
      if (res.ok) {
        const data = await res.json();
        const vars = Object.entries(data.variables || {}).map(([key, value]) => ({
          key,
          value: value as string,
        }));
        // Sort alphabetically
        vars.sort((a, b) => a.key.localeCompare(b.key));
        setVariables(vars);
      }
    } catch {
      setError("Failed to load saved variables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/variables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess("Variable saved!");
      setEditingKey(null);
      setShowAddNew(false);
      setNewKey("");
      setNewValue("");
      await fetchVariables();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete variable "${key}"? This cannot be undone.`)) return;
    setDeleting(key);
    setError(null);
    try {
      const res = await fetch("/api/user/variables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Variable deleted");
      await fetchVariables();
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to delete variable");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Variables</h1>
        <p className="text-muted-foreground">
          Default values for blueprint variables. These will be pre-filled when you download blueprints.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-500/50 dark:bg-sky-900/30">
        <div className="flex items-start gap-3">
          <Variable className="h-5 w-5 flex-shrink-0 text-sky-700 dark:text-sky-400 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-sky-200">
              How variables work
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Blueprints can contain variables like <code className="rounded bg-muted px-1.5 py-0.5 text-xs">[[PROJECT_NAME]]</code>. 
              When you download a blueprint, your saved values will be automatically filled in.
              Blueprint creators can also set defaults using <code className="rounded bg-muted px-1.5 py-0.5 text-xs">[[VAR|default]]</code> syntax — 
              your saved values take priority over creator defaults.
            </p>
          </div>
        </div>
      </div>

      {/* Variables List */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Your Saved Variables</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddNew(true)}
            disabled={showAddNew}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variable
          </Button>
        </div>

        {/* Add New Form */}
        {showAddNew && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Variable Name</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                  placeholder="PROJECT_NAME"
                  className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Default Value</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="My Project"
                  className="w-full rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddNew(false);
                  setNewKey("");
                  setNewValue("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(newKey, newValue)}
                disabled={!newKey.trim() || !newValue.trim() || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Variables Table */}
        {variables.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <Variable className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No saved variables yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Variables will appear here when you save them while downloading blueprints.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((variable) => (
              <div
                key={variable.key}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
              >
                {editingKey === variable.key ? (
                  <div className="flex flex-1 items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-sm font-medium">
                      {variable.key}
                    </code>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(variable.key, editValue)}
                      disabled={saving || !editValue.trim()}
                    >
                      {saving ? "..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingKey(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
                        [[{variable.key}]]
                      </code>
                      <span className="text-sm text-muted-foreground">→</span>
                      <span className="text-sm">{variable.value}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingKey(variable.key);
                          setEditValue(variable.value);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(variable.key)}
                        disabled={deleting === variable.key}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        {deleting === variable.key ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common Variables Suggestions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Common Variable Names</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Click to add any of these commonly used variables:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "PROJECT_NAME", hint: "Name of your project" },
            { key: "AUTHOR_NAME", hint: "Your name for attribution" },
            { key: "TEAM_NAME", hint: "Team or org name" },
            { key: "REPO_URL", hint: "Repository URL" },
            { key: "K8S_CLUSTER", hint: "Kubernetes cluster" },
            { key: "CONFLUENCE_URL", hint: "Documentation URL" },
            { key: "SLACK_CHANNEL", hint: "Team Slack channel" },
            { key: "API_BASE_URL", hint: "Base API URL" },
          ].map((suggestion) => {
            const exists = variables.some((v) => v.key === suggestion.key);
            return (
              <button
                key={suggestion.key}
                onClick={() => {
                  if (!exists) {
                    setShowAddNew(true);
                    setNewKey(suggestion.key);
                  }
                }}
                disabled={exists}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  exists
                    ? "border-green-500/30 bg-green-500/10 text-green-600 cursor-default"
                    : "hover:border-primary hover:bg-muted"
                }`}
                title={suggestion.hint}
              >
                {exists && <Check className="mr-1 inline h-3 w-3" />}
                {suggestion.key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Static file display names
const STATIC_FILE_NAMES: Record<string, string> = {
  funding: "FUNDING.yml",
  editorconfig: ".editorconfig",
  contributing: "CONTRIBUTING.md",
  codeOfConduct: "CODE_OF_CONDUCT.md",
  security: "SECURITY.md",
  gitignore: ".gitignore",
  dockerignore: ".dockerignore",
};

// Saved Files Section Component
interface SavedFile {
  key: string;
  value: string;
  isDefault: boolean;
}

function SavedFilesSection() {
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/user/wizard-preferences");
      if (res.ok) {
        const data = await res.json();
        // Get only static files category (wizard saves under "static" key)
        const staticFiles = data.static || {};
        const fileList = Object.entries(staticFiles).map(([key, val]) => ({
          key,
          value: (val as { value: string; isDefault: boolean }).value,
          isDefault: (val as { value: string; isDefault: boolean }).isDefault,
        }));
        // Sort by display name
        fileList.sort((a, b) => 
          (STATIC_FILE_NAMES[a.key] || a.key).localeCompare(STATIC_FILE_NAMES[b.key] || b.key)
        );
        setFiles(fileList);
      }
    } catch {
      setError("Failed to load saved files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/wizard-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: [{
            category: "static",
            key,
            value,
            isDefault: files.find(f => f.key === key)?.isDefault ?? false,
          }]
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess("File saved!");
      setEditingKey(null);
      await fetchFiles();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    const displayName = STATIC_FILE_NAMES[key] || key;
    if (!confirm(`Delete saved "${displayName}"? This cannot be undone.`)) return;
    setDeleting(key);
    setError(null);
    try {
      const res = await fetch(`/api/user/wizard-preferences?category=static&key=${key}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("File deleted");
      await fetchFiles();
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Files</h1>
        <p className="text-muted-foreground">
          Static files saved from the wizard. These will be pre-filled when you use the wizard.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-500/50 dark:bg-sky-900/30">
        <div className="flex items-start gap-3">
          <FileCode className="h-5 w-5 flex-shrink-0 text-sky-700 dark:text-sky-400 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-sky-200">
              How saved files work
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              When you generate configurations in the wizard and choose to &quot;Save to profile&quot;, your static files 
              (like <code className="rounded bg-muted px-1.5 py-0.5 text-xs">FUNDING.yml</code>, <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.editorconfig</code>) 
              are stored here. Next time you use the wizard, these values will be pre-filled automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Your Saved Files</h2>
        </div>

        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <FileCode className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No saved files yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the wizard and save your configurations to store files here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const displayName = STATIC_FILE_NAMES[file.key] || file.key;
              const isEditing = editingKey === file.key;
              const isLongContent = file.value.length > 100 || file.value.includes('\n');

              return (
                <div
                  key={file.key}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
                          {displayName}
                        </code>
                        {file.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            Default
                          </span>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="mt-3">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full h-48 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={() => handleSave(file.key, editValue)} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {isLongContent ? (
                            <pre className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 overflow-x-auto max-h-32 overflow-y-auto font-mono border">
                              {file.value.length > 500 ? file.value.slice(0, 500) + '\n...' : file.value}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">{file.value}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingKey(file.key);
                            setEditValue(file.value);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDelete(file.key)}
                          disabled={deleting === file.key}
                        >
                          {deleting === file.key ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// API Tokens Section Component
interface ApiTokensSectionProps {
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
}

interface ApiToken {
  id: string;
  name: string;
  lastFourChars: string;
  role: string;
  roleDisplay: string;
  expiresAt: string;
  isExpired: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "BLUEPRINTS_FULL", label: "Blueprints (Full Access)", description: "Create, read, update, delete blueprints" },
  { value: "BLUEPRINTS_READONLY", label: "Blueprints (Read Only)", description: "List and download blueprints only" },
  { value: "PROFILE_FULL", label: "Profile (Full Access)", description: "Read and update profile information" },
  { value: "FULL", label: "Full Access", description: "All permissions including profile and blueprints" },
];

const EXPIRATION_OPTIONS = [
  { value: 7, label: "1 week" },
  { value: 30, label: "1 month" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

function ApiTokensSection({ setError, setSuccess }: ApiTokensSectionProps) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenRole, setNewTokenRole] = useState("BLUEPRINTS_FULL");
  const [newTokenExpiration, setNewTokenExpiration] = useState(7);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("FREE");

  useEffect(() => {
    fetchTokens();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionPlan(data.plan || "FREE");
      }
    } catch {
      // Ignore errors
    }
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/api-tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      } else if (res.status === 403) {
        // User doesn't have access - that's fine, show upgrade message
        setTokens([]);
      } else {
        setError("Failed to fetch API tokens");
      }
    } catch {
      setError("Failed to fetch API tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTokenName.trim()) {
      setError("Token name is required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/user/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTokenName.trim(),
          role: newTokenRole,
          expirationDays: newTokenExpiration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create token");
        return;
      }

      setCreatedToken(data.token);
      setShowToken(true);
      setSuccess("Token created successfully! Copy it now - it won't be shown again.");
      setNewTokenName("");
      setShowCreateForm(false);
      fetchTokens();
    } catch {
      setError("Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    setError(null);

    try {
      const res = await fetch(`/api/user/api-tokens/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke token");
        return;
      }

      setSuccess("Token revoked successfully");
      fetchTokens();
    } catch {
      setError("Failed to revoke token");
    } finally {
      setRevoking(null);
    }
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canUseApi = ["PRO", "MAX", "TEAMS"].includes(subscriptionPlan);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Tokens</h1>
        <p className="text-muted-foreground">
          Manage API tokens for programmatic access to your blueprints
        </p>
      </div>

      {!canUseApi ? (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold">API Access Requires Pro or Higher</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                API tokens allow you to programmatically manage your blueprints via the command line or CI/CD pipelines.
                Upgrade to Pro, Max, or Teams to unlock API access.
              </p>
              <Link href="/pricing">
                <Button className="mt-4" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Created Token Display */}
          {createdToken && (
            <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Token Created Successfully!
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Copy this token now. For security, it won&apos;t be shown again.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background px-3 py-2 font-mono text-sm">
                      {showToken ? createdToken : "•".repeat(40)}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant={copied ? "default" : "outline"}
                      onClick={copyToken}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setCreatedToken(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tokens List */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Your API Tokens</h2>
                  <p className="text-sm text-muted-foreground">
                    {tokens.length} active token{tokens.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Token
              </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                <h3 className="mb-4 font-medium">Create New Token</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Token Name</label>
                    <input
                      type="text"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="e.g., CLI Tool, CI/CD Pipeline"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Permissions</label>
                    <select
                      value={newTokenRole}
                      onChange={(e) => setNewTokenRole(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ROLE_OPTIONS.find(r => r.value === newTokenRole)?.description}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Expiration</label>
                    <select
                      value={newTokenExpiration}
                      onChange={(e) => setNewTokenExpiration(Number(e.target.value))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      {EXPIRATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !newTokenName.trim()}
                    >
                      {creating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Create Token
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTokenName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tokens List */}
            {tokens.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Code className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No API tokens yet</p>
                <p className="text-sm">Create a token to access your blueprints via API</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      token.isExpired ? "border-red-500/30 bg-red-500/5" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Key className={`h-5 w-5 ${token.isExpired ? "text-red-500" : "text-muted-foreground"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.name}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            ...{token.lastFourChars}
                          </code>
                          {token.isExpired && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-500">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{token.roleDisplay}</span>
                          <span>•</span>
                          <span>
                            {token.isExpired ? "Expired" : "Expires"}{" "}
                            {new Date(token.expiresAt).toLocaleDateString()}
                          </span>
                          {token.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revoking === token.id}
                    >
                      {revoking === token.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-3 w-3" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">API Usage</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium">Authentication</h3>
                <p className="text-muted-foreground">
                  Include your token in the Authorization header:
                </p>
                <code className="mt-2 block rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                  Authorization: Bearer lp_your_token_here
                </code>
              </div>
              <div>
                <h3 className="font-medium">List Blueprints</h3>
                <code className="mt-2 block rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                  curl -H &quot;Authorization: Bearer $TOKEN&quot; https://lynxprompt.com/api/v1/blueprints
                </code>
              </div>
              <div>
                <h3 className="font-medium">Update Blueprint</h3>
                <code className="mt-2 block rounded-lg bg-muted px-3 py-2 font-mono text-xs overflow-x-auto">
                  curl -X PUT -H &quot;Authorization: Bearer $TOKEN&quot; -H &quot;Content-Type: application/json&quot; \<br />
                  &nbsp;&nbsp;-d &apos;{`{"content": "your updated content"}`}&apos; \<br />
                  &nbsp;&nbsp;https://lynxprompt.com/api/v1/blueprints/bp_your_blueprint_id
                </code>
              </div>
              <p className="text-muted-foreground">
                <Link href="/docs/api" className="text-primary hover:underline">
                  View full API documentation →
                </Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
