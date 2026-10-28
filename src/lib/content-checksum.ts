import { createHash } from "crypto";

/**
 * Checksum of a blueprint's content, used for optimistic locking between the
 * web editor, the API and the CLI.
 *
 * The server stores content trimmed, while files on disk usually end with a
 * newline and may use CRLF. Hashing the normalised text makes the same
 * content give the same checksum everywhere.
 *
 * The CLI keeps a copy of this function in cli/src/utils/blueprint-tracker.ts
 * (calculateChecksum). tests/lib/content-checksum.test.ts checks they agree.
 */
export function contentChecksum(content: string): string {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
