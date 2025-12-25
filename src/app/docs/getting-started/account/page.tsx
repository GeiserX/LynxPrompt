import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, Github, Mail, KeyRound, Shield } from "lucide-react";

export default function AccountSetupPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/getting-started" className="hover:text-foreground">
            Getting Started
          </Link>
          <span>/</span>
          <span>Account Setup</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Account Setup</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Create an account to save your preferences, manage blueprints, and
          access premium features.
        </p>
      </div>

      {/* Why create account */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Why Create an Account?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Save Preferences</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your wizard preferences and settings are remembered across
              sessions
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Favorite Blueprints</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Save blueprints you like for quick access later
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Share Blueprints</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and share your own configurations with the community
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Premium Features</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe to unlock advanced wizard steps and AI features
            </p>
          </div>
        </div>
      </section>

      {/* Sign up methods */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Sign Up Methods</h2>
        <p className="text-muted-foreground">
          LynxPrompt offers multiple ways to create an account. All methods are
          secure and don&apos;t require a traditional password.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-2">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">GitHub</h3>
                <p className="mt-1 text-muted-foreground">
                  Sign in with your GitHub account. Great for developers who
                  want quick access. Your GitHub profile picture and name will
                  be used.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-2">
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
              </div>
              <div>
                <h3 className="font-semibold">Google</h3>
                <p className="mt-1 text-muted-foreground">
                  Sign in with your Google account. Fast and secure. Your Google
                  profile picture and name will be used.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-2">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Magic Link (Email)</h3>
                <p className="mt-1 text-muted-foreground">
                  Enter your email and receive a login link. No password needed.
                  Works great if you don&apos;t want to use social login.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-muted p-2">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Passkeys (WebAuthn)</h3>
                <p className="mt-1 text-muted-foreground">
                  Use biometric authentication (Face ID, Touch ID, Windows
                  Hello) for the most secure login experience. Passkeys can be
                  added after creating your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button asChild className="mt-4">
          <Link href="/auth/signin">
            <UserPlus className="mr-2 h-4 w-4" />
            Create Account
          </Link>
        </Button>
      </section>

      {/* Account settings */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground">
          After creating your account, you can customize your profile and
          preferences in the{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Settings
          </Link>{" "}
          page.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Profile</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set your display name, job title, and skill level
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Security</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add passkeys and manage linked accounts
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Billing</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your subscription and payment methods
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Preferences</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set default wizard options and preferences
            </p>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <section className="rounded-xl border bg-muted/30 p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">Privacy & Security</h3>
            <p className="mt-1 text-muted-foreground">
              We take your privacy seriously. All data is stored in the EU with
              GDPR compliance. We use secure authentication, don&apos;t store
              passwords, and payments are handled by Stripe. Read our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

