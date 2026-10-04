/**
 * Names people type for themselves or their team are shown as plain text in
 * places we do not control: generated files, public profiles, download
 * modals and, once they exist, emails. Mail clients and chat apps turn
 * anything that looks like a web address into a clickable link, so a name
 * must never look like one. Reported to security@ on 2026-10-04.
 */

export const DISPLAY_NAME_MAX_LENGTH = 100;

// Control, zero-width and bidi characters: invisible, and they let two
// different names render identically.
const INVISIBLE =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/g;

// A scheme (https://), a www. prefix, or a bare host such as example.com or
// example.co.uk. The host rule needs letters right after the dot, so
// "Dr. Who" and "J.R.R. Tolkien" pass while "Dr.Who" and "john.doe" do not.
const LINK_LIKE =
  /(?:[a-z][a-z0-9+.-]*:\/\/|\bwww\.|[\p{L}\p{N}_-]+\.[a-z]{2,63}(?=$|[\s/?#:,;!)]))/iu;

export function looksLikeLink(value: string): boolean {
  return LINK_LIKE.test(value);
}

export type DisplayNameResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Normalises a user-typed name and rejects anything that is not a name.
 * `label` is used in the error message ("Display name", "Team name").
 */
export function validateDisplayName(
  input: unknown,
  label = "Display name"
): DisplayNameResult {
  if (typeof input !== "string") {
    return { ok: false, error: `${label} must be text` };
  }
  const value = input.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  if (value.length === 0) {
    return { ok: false, error: `${label} cannot be empty` };
  }
  if (value.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `${label} must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer`,
    };
  }
  if (/[<>]/.test(value)) {
    return { ok: false, error: `${label} cannot contain < or >` };
  }
  if (looksLikeLink(value)) {
    return { ok: false, error: `${label} cannot contain a link or web address` };
  }
  return { ok: true, value };
}
