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

export default function UserProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.displayName}
                  className="h-24 w-24 rounded-full border-4 border-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
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
                profile.socialWebsite || profile.socialYoutube || profile.socialBluesky) && (
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
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierStyles[template.tier] || ""}`}>
                        {template.tier}
                      </span>
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
