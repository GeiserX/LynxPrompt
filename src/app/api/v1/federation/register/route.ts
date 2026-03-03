import { NextRequest, NextResponse } from "next/server";
import { ENABLE_FEDERATION } from "@/lib/feature-flags";
import { prismaApp } from "@/lib/db-app";
import { validateDomainNotPrivate } from "@/lib/network-security";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > RATE_LIMIT_MAX;
}

interface WellKnownResponse {
  name?: string;
  domain?: string;
  version?: string;
  federation?: boolean;
  publicBlueprints?: number;
}

export async function POST(request: NextRequest) {
  if (!ENABLE_FEDERATION) {
    return NextResponse.json({ error: "Federation disabled" }, { status: 404 });
  }

  const clientIP =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 registrations per hour." },
      { status: 429 },
    );
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
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(sanitizedDomain)) {
    return NextResponse.json(
      { error: "Invalid domain format" },
      { status: 400 },
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
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch .well-known from ${sanitizedDomain}: HTTP ${res.status}` },
        { status: 422 },
      );
    }

    wellKnown = await res.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot reach ${sanitizedDomain}/.well-known/lynxprompt.json: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 422 },
    );
  }

  if (!wellKnown.federation || !wellKnown.domain || !wellKnown.name || !wellKnown.version) {
    return NextResponse.json(
      { error: "Invalid .well-known response: missing required fields (federation, domain, name, version)" },
      { status: 422 },
    );
  }

  if (wellKnown.domain.toLowerCase() !== sanitizedDomain) {
    return NextResponse.json(
      { error: `Domain mismatch: claimed ${sanitizedDomain} but .well-known reports ${wellKnown.domain}` },
      { status: 422 },
    );
  }

  const instance = await prismaApp.federatedInstance.upsert({
    where: { domain: sanitizedDomain },
    update: {
      name: wellKnown.name,
      version: wellKnown.version,
      publicBlueprintCount: wellKnown.publicBlueprints ?? 0,
      verified: true,
      lastSeenAt: new Date(),
    },
    create: {
      domain: sanitizedDomain,
      name: wellKnown.name,
      version: wellKnown.version,
      publicBlueprintCount: wellKnown.publicBlueprints ?? 0,
      verified: true,
      lastSeenAt: new Date(),
      registeredAt: new Date(),
    },
  });

  return NextResponse.json({
    verified: true,
    instanceId: instance.id,
    domain: instance.domain,
    name: instance.name,
  });
}
