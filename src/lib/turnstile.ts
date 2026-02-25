import { ENABLE_TURNSTILE } from "@/lib/feature-flags";

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true immediately if Turnstile is disabled via feature flag.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!ENABLE_TURNSTILE) {
    return true;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("Turnstile secret key not configured - skipping verification");
    return true;
  }

  // Dev bypass token
  if (token === "dev-bypass-token" && process.env.NODE_ENV === "development") {
    return true;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
    }

    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
