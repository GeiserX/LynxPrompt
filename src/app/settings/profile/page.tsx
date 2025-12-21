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
} from "lucide-react";
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
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
