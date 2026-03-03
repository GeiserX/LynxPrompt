import { NextRequest, NextResponse } from "next/server";
import { ENABLE_FEDERATION } from "@/lib/feature-flags";
import { prismaApp } from "@/lib/db-app";
import { validateDomainNotPrivate } from "@/lib/network-security";

interface WellKnownResponse {
  domain?: string;
  version?: string;
  federation?: boolean;
  publicBlueprints?: number;
}

export async function POST(request: NextRequest) {
  if (!ENABLE_FEDERATION) {
    return NextResponse.json({ error: "Federation disabled" }, { status: 404 });
  }

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { domain } = body;
  if (!domain || typeof domain !== "string") {
    return NextResponse.json(
      { error: "Missing required field: domain" },
      { status: 400 },
    );
  }

  const sanitizedDomain = domain.trim().toLowerCase();

  const existing = await prismaApp.federatedInstance.findUnique({
    where: { domain: sanitizedDomain },
  });

  if (!existing || !existing.verified) {
    return NextResponse.json(
      { error: "Instance not registered. Use /api/v1/federation/register first." },
      { status: 404 },
    );
  }

  // SSRF protection: ensure the domain does not resolve to a private/internal IP
  try {
    await validateDomainNotPrivate(sanitizedDomain);
  } catch {
    return NextResponse.json(
      { error: "Domain resolves to a private/reserved IP address" },
      { status: 400 },
    );
  }

  let wellKnown: WellKnownResponse;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(
      `https://${sanitizedDomain}/.well-known/lynxprompt.json`,
      { signal: controller.signal, redirect: "manual", headers: { Accept: "application/json" } },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Instance unreachable: HTTP ${res.status}` },
        { status: 422 },
      );
    }

    wellKnown = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot reach instance: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 422 },
    );
  }

  if (!wellKnown.federation || wellKnown.domain?.toLowerCase() !== sanitizedDomain) {
    return NextResponse.json(
      { error: "Invalid .well-known response or domain mismatch" },
      { status: 422 },
    );
  }

  await prismaApp.federatedInstance.update({
    where: { domain: sanitizedDomain },
    data: {
      lastSeenAt: new Date(),
      version: wellKnown.version ?? existing.version,
      publicBlueprintCount: wellKnown.publicBlueprints ?? existing.publicBlueprintCount,
    },
  });

  return NextResponse.json({ ok: true, lastSeenAt: new Date().toISOString() });
}
