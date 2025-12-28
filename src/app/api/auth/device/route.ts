import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { createHash } from "crypto";

// Helper to generate device hash
function generateDeviceHash(userAgent: string, fingerprint: string): string {
  const combined = `${userAgent}|${fingerprint}`;
  return createHash("sha256").update(combined).digest("hex");
}

// Helper to hash IP for privacy
function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 16);
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fingerprint, sessionToken } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Device fingerprint required" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown";

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

      // Update session to mark as trusted
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
            passkeyVerified: true,
            passkeyVerifiedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        isKnownDevice: true,
        requiresPasskey: false,
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

// PUT /api/auth/device - Trust the current device after passkey verification
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fingerprint, sessionToken, trustDevice } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Device fingerprint required" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "unknown";

    const deviceHash = generateDeviceHash(userAgent, fingerprint);
    const deviceName = getDeviceName(userAgent);
    const ipHash = hashIP(ip);

    // Update session to mark as verified
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
          passkeyVerified: true,
          passkeyVerifiedAt: new Date(),
        },
      });
    }

    // If user wants to trust this device, add to known devices
    if (trustDevice) {
      await prismaUsers.knownDevice.upsert({
        where: {
          userId_deviceHash: {
            userId: session.user.id,
            deviceHash,
          },
        },
        update: {
          lastSeenAt: new Date(),
          deviceName, // Update name in case it changed
        },
        create: {
          userId: session.user.id,
          deviceHash,
          deviceName,
          ipHash,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deviceTrusted: trustDevice,
      deviceName,
    });
  } catch (error) {
    console.error("Error trusting device:", error);
    return NextResponse.json(
      { error: "Failed to trust device" },
      { status: 500 }
    );
  }
}


