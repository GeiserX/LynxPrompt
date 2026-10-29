import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import AuthenticationDocsPage from "@/app/docs/api/authentication/page";
import AccountDocsPage from "@/app/docs/getting-started/account/page";
import PlatformsDocsPage from "@/app/docs/platforms/page";
import CliInstallationPage from "@/app/docs/cli/installation/page";
import { PLATFORMS } from "@/lib/platforms";

const text = (el: React.ReactElement) => (render(el).container.textContent || "").replace(/\s+/g, " ");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.ts$/.test(f) ? [p] : [];
  });
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? tsxFiles(p) : /\.tsx$/.test(f) ? [p] : [];
  });
}

describe("API authentication docs", () => {
  it("shows only error messages the API sends", () => {
    const api = sourceFiles(join(process.cwd(), "src/app/api")).map((f) => readFileSync(f, "utf8")).join("\n");
    const shown = [...text(<AuthenticationDocsPage />).matchAll(/"error": "([^"]+)"/g)].map((m) => m[1]);
    expect(shown.length).toBeGreaterThan(2);
    expect(shown.filter((msg) => !api.includes(`"${msg}"`))).toEqual([]);
  });
});

describe("account docs", () => {
  // Since 3.2.0 a registered passkey is asked for on every new session
  it("says a passkey is asked for on every new sign-in", () => {
    const page = text(<AccountDocsPage />);
    expect(page).not.toMatch(/new device or location/);
    expect(page).toContain("every new sign-in asks for it");
  });
});

describe("platform count", () => {
  it("counts coding agents, not slash-command formats", () => {
    const agents = PLATFORMS.filter((p) => !p.isCommand).length;
    const page = text(<PlatformsDocsPage />);
    expect(page).toContain(`${agents} AI coding assistants`);
    expect(page).not.toContain(`${PLATFORMS.length}+`);
  });

  it("hardcodes no platform count elsewhere on the site", () => {
    const files = [...sourceFiles(join(process.cwd(), "src")), ...tsxFiles(join(process.cwd(), "src"))];
    const hits = files.filter((f) => /\b[23]\d\+ (AI|supported)/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});

describe("Homebrew install docs", () => {
  // Homebrew refuses `brew tap` then `brew install lynxprompt` from an untrusted tap
  it("installs by the full formula name only", () => {
    const { container } = render(<CliInstallationPage />);
    const commands = Array.from(container.querySelectorAll(".bg-zinc-950 code")).map((c) => c.textContent || "");
    expect(commands).toContain("brew install GeiserX/lynxprompt/lynxprompt");
    expect(commands.filter((c) => /^brew tap|\nbrew install lynxprompt|^brew install lynxprompt$/m.test(c))).toEqual([]);
  });
});
