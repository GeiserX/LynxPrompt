import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { createHash } from "crypto";
import { sessionCookieName } from "@/lib/auth-cookies";
import { hashIP } from "@/lib/ip-hash";
import { getClientIP } from "@/lib/client-ip";
import { requireSession } from "@/lib/api-auth";

// Helper to generate device hash
function generateDeviceHash(userAgent: string, fingerprint: string): string {
  const combined = `${userAgent}|${fingerprint}`;
  return createHash("sha256").update(combined).digest("hex");
}

// Helper to extract device name from user agent
function getDeviceName(userAgent: string): string {
  // Extract browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  }

  // Extract OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }

  return `${browser} on ${os}`;
}

// POST /api/auth/device - Check if device is known and update session
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request, { allowUnverified: true });
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Device fingerprint required" },
        { status: 400 }
      );
    }

    // SECURITY: Read session token from cookies, not from request body
    const sessionToken = request.cookies.get(sessionCookieName())?.value;

    const userAgent = request.headers.get("user-agent") || "";
    const ip = getClientIP(request);

    const deviceHash = generateDeviceHash(userAgent, fingerprint);
    const deviceName = getDeviceName(userAgent);
    const ipHash = hashIP(ip);

    // Check if user has passkeys
    const userWithPasskeys = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        authenticators: { select: { id: true } },
      },
    });

    const hasPasskeys = (userWithPasskeys?.authenticators?.length ?? 0) > 0;

    if (!hasPasskeys) {
      // No passkeys - device doesn't matter
      return NextResponse.json({
        isKnownDevice: true,
        requiresPasskey: false,
        deviceName,
      });
    }

    // Check if this device is known
    const knownDevice = await prismaUsers.knownDevice.findUnique({
      where: {
        userId_deviceHash: {
          userId: session.user.id,
          deviceHash,
        },
      },
    });

    if (knownDevice) {
      // Update last seen
      await prismaUsers.knownDevice.update({
        where: { id: knownDevice.id },
        data: { lastSeenAt: new Date() },
      });

      // Record the device on the session. SECURITY: a known device does not
      // stand in for the passkey: the fingerprint comes from the client, so
      // only the WebAuthn verify handler may mark the session verified.
      if (sessionToken) {
        await prismaUsers.session.updateMany({
          where: {
            sessionToken,
            userId: session.user.id,
          },
          data: {
            deviceHash,
            deviceName,
            ipHash,
            isNewDevice: false,
          },
        });
      }

      return NextResponse.json({
        isKnownDevice: true,
        requiresPasskey: !auth.passkeyVerified,
        deviceName,
      });
    }

    // New device - update session with device info
    if (sessionToken) {
      await prismaUsers.session.updateMany({
        where: {
          sessionToken,
          userId: session.user.id,
        },
        data: {
          deviceHash,
          deviceName,
          ipHash,
          isNewDevice: true,
          passkeyVerified: false,
        },
      });
    }

    return NextResponse.json({
      isKnownDevice: false,
      requiresPasskey: true,
      deviceName,
    });
  } catch (error) {
    console.error("Error checking device:", error);
    return NextResponse.json(
      { error: "Failed to check device" },
      { status: 500 }
    );
  }
}
