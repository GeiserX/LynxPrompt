import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DollarSign, Check, ArrowRight } from "lucide-react";

export default function SellingBlueprintsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <span>/</span>
          <span>Selling Blueprints</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Selling Blueprints
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Turn your AI configuration expertise into income. Pro and Max
          subscribers can create and sell premium blueprints.
        </p>
      </div>

      {/* Requirements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Requirements to Sell</h2>
        <div className="rounded-xl border bg-card p-6">
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <span>Active Pro or Max subscription</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <span>Verified email address</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <span>PayPal account configured for payouts</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Pricing your blueprints */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Setting Your Price</h2>
        <p className="text-muted-foreground">
          You have full control over your blueprint pricing:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Minimum Price</h3>
            <p className="mt-1 text-2xl font-bold">€5</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The minimum price for paid blueprints
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">No Maximum</h3>
            <p className="mt-1 text-2xl font-bold">€∞</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set any price above the minimum
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Tip:</strong> Consider your blueprint&apos;s complexity and
            value. Simple configs might sell better at €5-10, while
            comprehensive enterprise setups can command €50+.
          </p>
        </div>
      </section>

      {/* Revenue */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Your Earnings</h2>
        <p className="text-muted-foreground">
          You keep 70% of every sale. Here&apos;s what that looks like:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-medium">
                  Blueprint Price
                </th>
                <th className="px-4 py-3 text-right font-medium">You Earn</th>
                <th className="px-4 py-3 text-right font-medium">
                  Platform Fee
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4">€5</td>
                <td className="px-4 py-3 text-right text-green-500">€3.50</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  €1.50
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">€10</td>
                <td className="px-4 py-3 text-right text-green-500">€7.00</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  €3.00
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">€25</td>
                <td className="px-4 py-3 text-right text-green-500">€17.50</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  €7.50
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">€50</td>
                <td className="px-4 py-3 text-right text-green-500">€35.00</td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  €15.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Best practices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips for Success</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Write Great Descriptions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Clearly explain what the blueprint does, who it&apos;s for, and
              what makes it valuable
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Use Relevant Tags</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add tags for technologies, frameworks, and use cases to improve
              discoverability
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Variables</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Make blueprints customizable with template variables so buyers can
              personalize them
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep It Updated</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your blueprints when frameworks or tools change to maintain
              their value
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Offer Free Samples</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create free basic versions to build trust before selling premium
              ones
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Respond to Feedback</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Engage with buyers who have questions or suggestions
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Start selling today</h2>
          <p className="mt-1 text-sm text-white/80">
            Create your first paid blueprint and earn from your expertise.
          </p>
        </div>
        <Button asChild className="bg-white text-green-600 hover:bg-white/90">
          <Link href="/blueprints/create">
            Create Blueprint <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}


