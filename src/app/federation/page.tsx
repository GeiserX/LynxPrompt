import type { Metadata } from "next";
import Link from "next/link";
import {
  APP_NAME,
  APP_URL,
  ENABLE_FEDERATION,
  FEDERATION_REGISTRY_URL,
} from "@/lib/feature-flags";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import { Globe, ExternalLink, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Federation",
  description: `Discover ${APP_NAME} instances in the federated network. Self-hosted instances can join the network and share public blueprints.`,
  alternates: { canonical: `${APP_URL}/federation` },
};

interface FederatedInstance {
  id: string;
  domain: string;
  name: string;
  version: string;
  logoUrl: string;
  publicBlueprintCount: number;
  lastSeenAt: string;
  registeredAt: string;
}

async function getInstances(): Promise<FederatedInstance[]> {
  try {
    const res = await fetch(
      `${FEDERATION_REGISTRY_URL}/api/v1/federation/instances`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.instances ?? [];
  } catch {
    return [];
  }
}

function isActive(lastSeenAt: string): boolean {
  return Date.now() - new Date(lastSeenAt).getTime() < 24 * 60 * 60 * 1000;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function FederationPage() {
  if (!ENABLE_FEDERATION) notFound();

  const instances = await getInstances();

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader currentPage="federation" breadcrumbLabel="Federation" />

      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Globe className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Federated Network
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {APP_NAME} instances that have joined the federation. Each instance
              is independently hosted and verified via its{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                .well-known/lynxprompt.json
              </code>{" "}
              endpoint.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {instances.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Globe className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-semibold">
                No instances registered yet
              </h2>
              <p className="mt-2 text-muted-foreground">
                Deploy your own {APP_NAME} instance and it will automatically
                register with the federation on startup.
              </p>
              <Button asChild className="mt-6">
                <Link href="/docs">
                  Self-hosting Docs
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {instances.length} instance{instances.length !== 1 ? "s" : ""}{" "}
                  registered
                </p>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  Active in last 24h
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {instances.map((instance) => {
                  const active = isActive(instance.lastSeenAt);
                  return (
                    <a
                      key={instance.id}
                      href={`https://${instance.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-lg border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              active ? "bg-green-500" : "bg-muted-foreground/30"
                            }`}
                            title={active ? "Active" : "Inactive"}
                          />
                          <h3 className="font-semibold group-hover:text-primary">
                            {instance.name}
                          </h3>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {instance.domain}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          v{instance.version}
                        </span>
                        {instance.publicBlueprintCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <FileCode2 className="h-3 w-3" />
                            {instance.publicBlueprintCount} public
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Last seen {timeAgo(instance.lastSeenAt)}
                      </p>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xl font-bold">Join the Federation</h2>
            <p className="mt-3 text-muted-foreground">
              Deploy your own {APP_NAME} instance with{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                ENABLE_FEDERATION=true
              </code>{" "}
              and it will automatically register on startup. No API keys or
              manual steps required.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/docs">Get Started</Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={`${APP_URL}/api/v1/federation/instances`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View API
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
