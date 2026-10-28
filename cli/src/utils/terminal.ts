/**
 * Make text from the server safe to print in a terminal.
 *
 * Blueprint names, descriptions, tags and content are written by other users.
 * Printed raw, an ESC byte starts an escape sequence that can recolor or clear
 * the screen, rewrite earlier lines or set the window title, and bidi controls
 * reorder what the reader sees. This drops C0 and C1 control characters (tab
 * and newline excepted) and the bidi embedding, override and isolate controls.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_TERMINAL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f‪-‮⁦-⁩]/g;

export function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(UNSAFE_TERMINAL_CHARS, "");
}
