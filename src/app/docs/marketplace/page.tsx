import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";

export default function MarketplaceOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Discover and share AI IDE configurations. The marketplace connects
          blueprint creators with developers who need them.
        </p>
      </div>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How the Marketplace Works</h2>
        <p className="text-muted-foreground">
          LynxPrompt operates as a platform that connects blueprint creators
          with developers. We handle hosting and discovery so you can focus on
          building great configurations.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">For Users</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Browse community blueprints</li>
              <li>• Download and use instantly</li>
              <li>• Save favorites for quick access</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">For Creators</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• All users can share blueprints</li>
              <li>• Build your reputation in the community</li>
              <li>• Get feedback via downloads and favorites</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Trust & Safety</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Content Moderation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Blueprints are reviewed to ensure quality and prevent abuse
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">EU Compliant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              GDPR compliant with data stored in the EU
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to get started?</h2>
          <p className="mt-1 text-sm text-white/80">
            Browse community blueprints or share your own configurations.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
