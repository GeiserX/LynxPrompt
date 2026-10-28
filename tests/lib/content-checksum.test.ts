import { describe, it, expect } from "vitest";
import { contentChecksum } from "@/lib/content-checksum";
import { calculateChecksum } from "../../cli/src/utils/blueprint-tracker";

// The CLI sends its stored checksum as expected_checksum, and the server
// compares it with its own. Both sides must hash the same content the same way.
const samples = [
  "# AGENTS.md\n\nUse pnpm.",
  "# AGENTS.md\n\nUse pnpm.\n",
  "# AGENTS.md\r\n\r\nUse pnpm.\r\n",
  "\n\n  # AGENTS.md\n\nUse pnpm.  \n\n",
  "",
];

describe("blueprint content checksum", () => {
  it.each(samples)("CLI and server agree on %j", (content) => {
    expect(calculateChecksum(content)).toBe(contentChecksum(content));
  });

  // The server stores content.trim(); a file on disk ends in a newline.
  it("gives a file ending in a newline the checksum of the trimmed text the server stores", () => {
    const onDisk = "# AGENTS.md\n\nUse pnpm.\n";
    expect(calculateChecksum(onDisk)).toBe(contentChecksum(onDisk.trim()));
  });

  it("ignores CRLF line endings", () => {
    expect(calculateChecksum("a\r\nb\r\n")).toBe(contentChecksum("a\nb"));
  });

  it("still tells different content apart", () => {
    expect(contentChecksum("a\nb")).not.toBe(contentChecksum("a\nc"));
    expect(contentChecksum("a\nb")).toMatch(/^[0-9a-f]{16}$/);
  });
});
