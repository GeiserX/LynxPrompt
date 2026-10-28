/**
 * Client side of the passkey second factor.
 *
 * The API answers 403 {passkeyRequired: true} to a session that still owes
 * its passkey (src/lib/api-auth.ts). Instead of every page showing that as an
 * error, one fetch wrapper sends the user to the passkey step and back.
 */

/** Fired on window just before the redirect, so a page can keep unsaved work */
export const PASSKEY_REDIRECT_EVENT = "lynxprompt:passkey-redirect";

/** The passkey step, coming back to `back` (a same-origin path) once verified */
export function passkeyStepUrl(back: string): string {
  return `/auth/verify-passkey?callbackUrl=${encodeURIComponent(back)}`;
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  return (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function urlOf(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : String(input);
}

/**
 * Wrap window.fetch so a write the API refused for a missing passkey takes the
 * user to the passkey step, then back to this page. Reads are left to the
 * page: public pages also fetch signed-in extras (favorites, the plan badge)
 * in the background, and one of those failing must not pull a visitor off a
 * public page. The refused call never settles, so the page shows no error
 * while it leaves. Returns the function that removes the wrapper.
 */
export function installPasskeyRedirect(win: Window = window): () => void {
  const original = win.fetch;

  const wrapped: typeof fetch = async (input, init) => {
    const res = await original.call(win, input, init);
    if (res.status !== 403) return res;

    const method = methodOf(input, init);
    if (method === "GET" || method === "HEAD") return res;

    const url = new URL(urlOf(input), win.location.href);
    if (url.origin !== win.location.origin || !url.pathname.startsWith("/api/")) return res;
    // The sign-in steps handle the passkey themselves
    if (win.location.pathname.startsWith("/auth/")) return res;

    const body = await res.clone().json().catch(() => null);
    if (body?.passkeyRequired !== true) return res;

    win.dispatchEvent(new Event(PASSKEY_REDIRECT_EVENT));
    win.location.assign(passkeyStepUrl(`${win.location.pathname}${win.location.search}`));
    return new Promise<Response>(() => {});
  };

  win.fetch = wrapped;
  return () => {
    if (win.fetch === wrapped) win.fetch = original;
  };
}
