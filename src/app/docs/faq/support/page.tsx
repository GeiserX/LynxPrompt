import Link from "next/link";
import { MessageSquareHeart, Bug, Lightbulb, Crown, ChevronUp, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupportDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <MessageSquareHeart className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Support & Feedback</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn how to get help, report bugs, and suggest features. Pro and Max
          subscribers receive prioritized support.
        </p>
      </div>

      {/* Quick access */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Need help or have feedback?</h2>
            <p className="text-sm text-muted-foreground">
              Visit our Support page to report issues or suggest improvements.
            </p>
          </div>
          <Button asChild>
            <Link href="/support">
              <MessageSquareHeart className="mr-2 h-4 w-4" />
              Go to Support
            </Link>
          </Button>
        </div>
      </div>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How the Support System Works</h2>
        <p className="text-muted-foreground">
          Our support system is a community-driven feedback forum where you can:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <Bug className="mb-3 h-6 w-6 text-red-500" />
            <h3 className="font-semibold">Report Bugs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Found something broken? Submit a detailed bug report with steps to
              reproduce, and our team will investigate.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <Lightbulb className="mb-3 h-6 w-6 text-amber-500" />
            <h3 className="font-semibold">Suggest Features</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Have an idea to improve LynxPrompt? Share your feature request and
              let the community vote on it.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <ChevronUp className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">Vote & Prioritize</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upvote existing suggestions to help us prioritize what gets built
              next. Popular requests rise to the top.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <Users className="mb-3 h-6 w-6 text-blue-500" />
            <h3 className="font-semibold">Community Discussion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comment on posts to add context, share workarounds, or discuss
              implementation details.
            </p>
          </div>
        </div>
      </section>

      {/* Pro/Max Priority */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Priority Support for Pro & Max</h2>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
          <div className="flex items-start gap-4">
            <Crown className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold">Subscriber Benefits</h3>
              <p className="mt-2 text-muted-foreground">
                Pro and Max subscribers receive prioritized attention for their
                feedback:
              </p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="mt-1 rounded bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-xs font-bold text-white">
                    Pro
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Your posts display a Pro badge, helping us identify and
                    prioritize feedback from paying customers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                    Max
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Your posts display a Max badge for highest priority. Max
                    subscribers&apos; bug reports receive faster attention.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                We review all feedback, but subscribers&apos; issues and requests
                are given priority in our development roadmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin responses */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Official Responses</h2>
        <div className="flex items-start gap-4 rounded-lg border bg-card p-5">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">Staff Replies</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Responses from the LynxPrompt team are marked with a{" "}
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                Staff
              </span>{" "}
              badge. Official responses may include:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Confirmation that a bug has been logged</li>
              <li>Updates on feature request status</li>
              <li>Workarounds or solutions</li>
              <li>Timeline estimates for fixes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Status tracking */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Post Status</h2>
        <p className="text-muted-foreground">
          Each post has a status that indicates its progress:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
              Open
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              New submission, awaiting review
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500">
              In Progress
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Being actively worked on
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
              Completed
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Fixed or implemented
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-500">
              Closed
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Won&apos;t fix or out of scope
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500">
              Duplicate
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Already reported elsewhere
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-center text-white">
        <h2 className="text-xl font-bold">Ready to share your feedback?</h2>
        <p className="mt-2 text-white/80">
          Your input helps shape the future of LynxPrompt.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild className="bg-white text-purple-600 hover:bg-white/90">
            <Link href="/support">
              <Bug className="mr-2 h-4 w-4" />
              Report a Bug
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white bg-transparent text-white hover:bg-white/20"
          >
            <Link href="/support">
              <Lightbulb className="mr-2 h-4 w-4" />
              Suggest a Feature
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}







