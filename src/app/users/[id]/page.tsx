"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  Download,
  Heart,
  Calendar,
  Briefcase,
  Award,
  ArrowLeft,
  Lock,
  FileText,
  Euro,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  tier: string;
  category: string | null;
  tags: string[];
  downloads: number;
  favorites: number;
  price: number | null;
  currency: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  image: string | null;
  isProfilePublic: boolean;
  persona: string | null;
  skillLevel: string | null;
  socialGithub: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialWebsite: string | null;
  socialYoutube: string | null;
  socialBluesky: string | null;
  socialMastodon: string | null;
  socialDiscord: string | null;
  memberSince: string;
  templates: Template[];
  templateCount: number;
  totalDownloads: number;
  totalFavorites: number;
}

const tierStyles: Record<string, string> = {
  SIMPLE: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  INTERMEDIATE: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ADVANCED: "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

// Command type detection
const COMMAND_TYPES = [
  "CURSOR_COMMAND", "CLAUDE_COMMAND", "WINDSURF_WORKFLOW", 
  "COPILOT_PROMPT", "CONTINUE_PROMPT", "OPENCODE_COMMAND"
];
const isCommandType = (type?: string) => type ? COMMAND_TYPES.includes(type) : false;

const skillLevelLabels: Record<string, string> = {
  novice: "Novice",
  intermediate: "Intermediate",
  senior: "Senior",
  expert: "Expert",
};

const personaLabels: Record<string, string> = {
  backend: "Backend Developer",
  frontend: "Frontend Developer",
  fullstack: "Full Stack Developer",
  devops: "DevOps Engineer",
  mobile: "Mobile Developer",
  data: "Data Engineer",
  ml: "ML Engineer",
  security: "Security Engineer",
  other: "Developer",
};

// Profile avatar component with proper fallback handling
function ProfileAvatar({ image, displayName }: { image: string | null; displayName: string }) {
  const [imageError, setImageError] = useState(false);
  
  // Show initials fallback if no image or image failed to load
  if (!image || imageError) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  return (
    <img
      src={image}
      alt={displayName}
      className="h-24 w-24 rounded-full border-4 border-primary/20 object-cover"
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
    />
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discordCopied, setDiscordCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else if (res.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <User className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h1 className="mt-4 text-2xl font-bold">{error || "User not found"}</h1>
            <p className="mt-2 text-muted-foreground">
              This user doesn&apos;t exist or their profile is not available.
            </p>
            <Button asChild className="mt-6">
              <Link href="/blueprints">Browse Blueprints</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Private profile view
  if (!profile.isProfilePublic) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">{profile.displayName}</h1>
            <p className="mt-2 text-muted-foreground">
              This profile is private.
            </p>
            <Button asChild className="mt-6">
              <Link href="/blueprints">Browse Blueprints</Link>
            </Button>
          </div>
        </main>
        <Footer />
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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blueprints">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Blueprints
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            {/* Avatar */}
            <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-6">
              <ProfileAvatar image={profile.image} displayName={profile.displayName} />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                {profile.persona && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {personaLabels[profile.persona] || profile.persona}
                  </span>
                )}
                {profile.skillLevel && (
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {skillLevelLabels[profile.skillLevel] || profile.skillLevel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since {new Date(profile.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold">{profile.templateCount}</div>
                  <div className="text-sm text-muted-foreground">Blueprints</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold">{profile.totalDownloads}</div>
                  <div className="text-sm text-muted-foreground">Downloads</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold">{profile.totalFavorites}</div>
                  <div className="text-sm text-muted-foreground">Favorites</div>
                </div>
              </div>

              {/* Social Links */}
              {(profile.socialGithub || profile.socialTwitter || profile.socialLinkedin || 
                profile.socialWebsite || profile.socialYoutube || profile.socialBluesky ||
                profile.socialMastodon || profile.socialDiscord) && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  {profile.socialGithub && (
                    <a
                      href={`https://github.com/${profile.socialGithub}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Github className="h-4 w-4" />
                      {profile.socialGithub}
                    </a>
                  )}
                  {profile.socialTwitter && (
                    <a
                      href={`https://x.com/${profile.socialTwitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Twitter className="h-4 w-4" />
                      @{profile.socialTwitter}
                    </a>
                  )}
                  {profile.socialLinkedin && (
                    <a
                      href={profile.socialLinkedin.startsWith("http") ? profile.socialLinkedin : `https://linkedin.com/in/${profile.socialLinkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.socialBluesky && (
                    <a
                      href={`https://bsky.app/profile/${profile.socialBluesky}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 360 320" fill="currentColor">
                        <path d="M180 142c-16.3-31.7-60.7-90.8-102-120C38.5-5.9 0 1.4 0 45.6c0 31.7 15.3 133.4 61.2 150.4 44.5 16.5 82.8-10 92.8-37.4 10 27.4 48.3 53.9 92.8 37.4C292.7 179 308 77.3 308 45.6c0-44.2-38.5-51.5-78-23.6-41.3 29.2-85.7 88.3-102 120h52z"/>
                      </svg>
                      @{profile.socialBluesky}
                    </a>
                  )}
                  {profile.socialYoutube && (
                    <a
                      href={profile.socialYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </a>
                  )}
                  {profile.socialWebsite && (
                    <a
                      href={profile.socialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profile.socialMastodon && (
                    <a
                      href={`https://${profile.socialMastodon.includes("@") ? profile.socialMastodon.split("@").slice(-1)[0] : "mastodon.social"}/@${profile.socialMastodon.split("@")[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
                      </svg>
                      @{profile.socialMastodon}
                    </a>
                  )}
                  {profile.socialDiscord && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.socialDiscord!);
                        // SECURITY: Use React state instead of innerHTML to prevent XSS
                        setDiscordCopied(true);
                        setTimeout(() => setDiscordCopied(false), 1500);
                      }}
                      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary cursor-pointer"
                      title="Click to copy Discord username"
                    >
                      {discordCopied ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          @{profile.socialDiscord}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Templates Grid */}
          <div>
            <h2 className="mb-6 text-xl font-semibold">
              Public Blueprints ({profile.templateCount})
            </h2>

            {profile.templates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  No public blueprints yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.templates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/blueprints/${template.id}`}
                    className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold group-hover:text-primary">
                        {template.name}
                      </h3>
                      {template.price && template.price > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-xs font-medium text-pink-700 dark:text-pink-300">
                          <Euro className="h-3 w-3" />
                          {(template.price / 100).toFixed(2)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                          Free
                        </span>
                      )}
                    </div>
                    
                    {template.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierStyles[template.tier] || ""}`}>
                          {template.tier}
                        </span>
                        {isCommandType(template.type) && (
                          <span className="rounded bg-gradient-to-r from-violet-500 to-purple-500 px-1.5 py-0.5 text-xs font-medium text-white">
                            ⚡ Command
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {template.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {template.favorites}
                        </span>
                      </div>
                    </div>

                    {template.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
