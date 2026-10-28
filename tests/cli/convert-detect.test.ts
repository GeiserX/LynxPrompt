import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { detectSourceFile } from "../../cli/src/utils/convert-format";

describe("lynxp convert source auto-detect", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lynxp-convert-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  // The exact path is checked: on a case-insensitive disk (macOS) a lowercase
  // lookup finds the file under the wrong name, on Linux it finds nothing
  it("finds Aider's CONVENTIONS.md under its real name", async () => {
    await writeFile(join(dir, "CONVENTIONS.md"), "# Conventions\n");
    expect(await detectSourceFile(dir)).toEqual({ path: join(dir, "CONVENTIONS.md"), platform: "aider" });
  });

  it("finds CLAUDE.md", async () => {
    await writeFile(join(dir, "CLAUDE.md"), "# Claude\n");
    const found = await detectSourceFile(dir);
    expect(found?.platform).toBe("claude");
  });

  it("finds nothing in an empty folder", async () => {
    expect(await detectSourceFile(dir)).toBeNull();
  });
});
