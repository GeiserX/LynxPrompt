import {
  ENABLE_FEDERATION,
  FEDERATION_REGISTRY_URL,
  APP_URL,
} from "@/lib/feature-flags";

const HEARTBEAT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const REGISTRATION_RETRY_MS = 5 * 60 * 1000; // 5 minutes

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// The registry fetches https://<domain>/.well-known/lynxprompt.json, so only a
// public DNS name on the default https port can join. A DNS name is at most
// 253 characters, so nothing longer reaches the regex; labels cannot contain a
// dot, so each one is split off without backtracking.
const MAX_DOMAIN_LENGTH = 253;
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** True when the registry can accept this domain (no port, no IP, no localhost). */
export function isFederationDomain(domain: string): boolean {
  return domain.length <= MAX_DOMAIN_LENGTH && DOMAIN_PATTERN.test(domain);
}

/**
 * Cache headers for the public federation reads (the catalog, the instance
 * list and /.well-known/lynxprompt.json), so a CDN in front of the instance
 * can answer repeat requests. All three show public data only.
 */
export const FEDERATION_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
};

/** The host of APP_URL when the registry could reach it, or null. */
function joinableDomain(): string | null {
  try {
    const url = new URL(APP_URL);
    if (url.protocol !== "https:") return null;
    return isFederationDomain(url.host) ? url.host : null;
  } catch {
    return null;
  }
}

function getInstanceDomain(): string {
  return new URL(APP_URL).host;
}

export function isSelfRegistry(): boolean {
  try {
    const registryHost = new URL(FEDERATION_REGISTRY_URL).host;
    return registryHost === getInstanceDomain();
  } catch {
    return false;
  }
}

async function registerWithFederation(): Promise<boolean> {
  const domain = getInstanceDomain();

  try {
    const res = await fetch(
      `${FEDERATION_REGISTRY_URL}/api/v1/federation/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      console.log(
        `[federation] Registered with ${FEDERATION_REGISTRY_URL} as "${data.name}" (${data.domain})`,
      );
      return true;
    }

    const error = await res.text();
    console.warn(
      `[federation] Registration failed (${res.status}): ${error}`,
    );
    return false;
  } catch (err) {
    console.warn(
      `[federation] Registration error: ${err instanceof Error ? err.message : err}`,
    );
    return false;
  }
}

async function sendHeartbeat(): Promise<void> {
  const domain = getInstanceDomain();

  try {
    const res = await fetch(
      `${FEDERATION_REGISTRY_URL}/api/v1/federation/heartbeat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      },
    );

    if (res.ok) {
      console.log("[federation] Heartbeat sent successfully");
    } else {
      const error = await res.text();
      console.warn(`[federation] Heartbeat failed (${res.status}): ${error}`);

      if (res.status === 404) {
        console.log("[federation] Not registered, attempting re-registration...");
        await registerWithFederation();
      }
    }
  } catch (err) {
    console.warn(
      `[federation] Heartbeat error: ${err instanceof Error ? err.message : err}`,
    );
  }
}

export function initFederation(): void {
  if (!ENABLE_FEDERATION) {
    console.log("[federation] Disabled; set ENABLE_FEDERATION=true to join the registry");
    return;
  }

  if (isSelfRegistry()) {
    console.log(
      "[federation] This instance IS the registry — skipping self-registration",
    );
    return;
  }

  if (!joinableDomain()) {
    console.warn(
      `[federation] Not joining: APP_URL (${APP_URL}) must be a public https address the registry can reach`,
    );
    return;
  }

  console.log(
    `[federation] Initializing federation with registry ${FEDERATION_REGISTRY_URL}`,
  );

  (async () => {
    const registered = await registerWithFederation();
    if (!registered) {
      console.log(
        `[federation] Will retry registration in ${REGISTRATION_RETRY_MS / 1000}s`,
      );
      setTimeout(async () => {
        const retried = await registerWithFederation();
        if (!retried) {
          console.warn(
            "[federation] Registration retry failed. Heartbeats will attempt re-registration.",
          );
        }
      }, REGISTRATION_RETRY_MS);
    }
  })();

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  console.log(
    `[federation] Heartbeat scheduled every ${HEARTBEAT_INTERVAL_MS / 1000 / 60 / 60}h`,
  );
}
