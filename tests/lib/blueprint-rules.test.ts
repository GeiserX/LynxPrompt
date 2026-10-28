import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db-users", () => ({ prismaUsers: {} }));

import { BLUEPRINT_TYPES, normalizeBlueprintType } from "@/lib/blueprint-rules";

describe("normalizeBlueprintType", () => {
  it("keeps every stored type as sent", () => {
    for (const type of BLUEPRINT_TYPES) {
      expect(normalizeBlueprintType(type)).toBe(type);
    }
  });

  it("stores skills and MCP configs as their own types, not as AGENTS.md or CUSTOM", () => {
    expect(normalizeBlueprintType("AGENT_SKILL")).toBe("AGENT_SKILL");
    expect(normalizeBlueprintType("mcp-config")).toBe("MCP_CONFIG");
  });

  it("ignores case, dashes and surrounding spaces", () => {
    expect(normalizeBlueprintType(" kiro-steering ")).toBe("KIRO_STEERING");
  });

  it("maps the names older CLI releases send", () => {
    expect(normalizeBlueprintType("GOOSE_HINTS")).toBe("GOOSEHINTS");
    expect(normalizeBlueprintType("OPENHANDS_CONFIG")).toBe("OPENHANDS_MD");
    expect(normalizeBlueprintType("OPENCODE_CONFIG")).toBe("OPENCODE_JSON");
    expect(normalizeBlueprintType("FIREBASE_RULES")).toBe("IDX_CONFIG");
  });

  it("maps the loose names older web clients send", () => {
    expect(normalizeBlueprintType("cursor")).toBe("CURSOR_RULES");
    expect(normalizeBlueprintType("claude")).toBe("CLAUDE_MD");
    expect(normalizeBlueprintType("cursor-command")).toBe("CURSOR_COMMAND");
    expect(normalizeBlueprintType("agents")).toBe("AGENTS_MD");
  });

  it("turns anything else into CUSTOM", () => {
    expect(normalizeBlueprintType("CRUSH_MD")).toBe("CUSTOM");
    expect(normalizeBlueprintType("not-a-type")).toBe("CUSTOM");
    expect(normalizeBlueprintType(undefined)).toBe("CUSTOM");
    expect(normalizeBlueprintType(42)).toBe("CUSTOM");
  });
});
