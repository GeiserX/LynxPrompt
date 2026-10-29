import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

vi.mock("@/components/page-header", () => ({ PageHeader: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));

import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import CookiesPage from "@/app/cookies/page";
import DpaPage from "@/app/dpa/page";

const text = (el: React.ReactElement) => (render(el).container.textContent || "").replace(/\s+/g, " ");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}
const code = sourceFiles(join(process.cwd(), "src")).map((f) => readFileSync(f, "utf8")).join("\n");

// The legal pages must say what the code does.
describe("legal pages match the code", () => {
  it("privacy: disabling SSO keeps its configuration, removing it deletes it", () => {
    const page = text(<PrivacyPage />);
    expect(page).not.toMatch(/deleted when the team is deleted or SSO is disabled/);
    expect(page).toContain("Disabling SSO keeps the configuration");
  });

  it("terms: team blueprints stay with their author", () => {
    const page = text(<TermsPage />);
    expect(page).not.toMatch(/team-shared blueprints are deleted/);
    expect(page).not.toMatch(/Team blueprints belong to the team/);
    expect(page).toContain("A blueprint always belongs to its author");
    expect(page).toContain("the blueprints shared with it are not deleted");
  });

  it("DPA and privacy name the same outside services", () => {
    const dpa = text(<DpaPage />);
    const privacy = text(<PrivacyPage />);
    for (const name of ["GitHub", "Google", "Anthropic", "Cloudflare", "Gravatar"]) {
      expect(dpa).toContain(name);
      expect(privacy).toContain(name);
    }
  });

  it("privacy discloses the download IP hash", () => {
    expect(code).toContain("hashIP(");
    expect(text(<PrivacyPage />)).toContain("a keyed hash of your IP address");
  });

  it("cookie policy lists every cookie and storage key the app sets", () => {
    const page = text(<CookiesPage />);
    const cookies = [...code.matchAll(/cookies\.set\("([^"]+)"/g)].map((m) => m[1]);
    const storage = [...code.matchAll(/(?:local|session)Storage\.setItem\(\s*"([^"]+)"/g)].map((m) => m[1]);
    // Keys kept in constants
    const keyConsts = [...code.matchAll(/_KEY\s*=\s*"([a-z][\w-]+)"/g)].map((m) => m[1]);
    expect(cookies).toContain("sso_state");
    const named = [...new Set([...cookies, ...storage, ...keyConsts])];
    expect(named.filter((k) => !page.includes(k))).toEqual([]);
  });
});
