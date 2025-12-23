/**
 * Verify a Cloudflare Turnstile token server-side
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If no secret key configured, skip verification (dev mode)
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
