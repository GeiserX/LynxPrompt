"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  FileText,
  Settings,
  Shield,
  ArrowRight,
  Sparkles,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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
            Please sign in to access your dashboard.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create Configuration",
      description: "Generate AI IDE configurations with our wizard",
      icon: Wand2,
      href: "/wizard",
      primary: true,
    },
    {
      title: "Share Your Template",
      description: "Upload and sell your own AI prompts and configs",
      icon: Upload,
      href: "/templates/create",
    },
    {
      title: "Browse Templates",
      description: "Explore community templates and best practices",
      icon: FileText,
      href: "/templates",
    },
    {
      title: "Profile Settings",
      description: "Customize your profile and linked accounts",
      icon: Settings,
      href: "/settings/profile",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/templates" className="text-sm hover:underline">
              Templates
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
            </h1>
            <p className="mt-2 text-muted-foreground">
              What would you like to do today?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group relative overflow-hidden rounded-lg border p-6 transition-all hover:border-primary hover:shadow-md ${
                  action.primary ? "border-primary bg-primary/5" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-lg p-2 ${
                      action.primary
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-4 font-semibold">{action.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Getting Started Tip */}
          <div className="mt-8 rounded-lg border bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">New to LynxPrompt?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start by creating your first AI IDE configuration. Our wizard
                  will guide you through selecting your tech stack, coding
                  style, and preferences.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/wizard">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
