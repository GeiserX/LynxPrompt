import { describe, it, expect } from "vitest";
import { detectSensitiveData, getSensitiveDataSummary } from "@/lib/sensitive-data";

describe("detectSensitiveData", () => {
  it("returns empty array for clean content", () => {
    const content = "const x = 1;\nconst y = 'hello';";
    expect(detectSensitiveData(content)).toEqual([]);
  });

  it("detects OpenAI API keys", () => {
    const content = "const key = 'sk-proj-Xt9wQmR7nKpLsD4vYhJbUfGc';";
    const matches = detectSensitiveData(content);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.type === "OpenAI Key")).toBe(true);
  });

  it("detects Anthropic API keys", () => {
    const content = "key=sk-ant-api03-Xt9wQmR7nKpLsD4vYhJbUfGcZeOiAa";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "Anthropic Key")).toBe(true);
  });

  it("detects GitHub tokens", () => {
    const content = "token = ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "GitHub Token")).toBe(true);
  });

  it("detects AWS access keys", () => {
    // AKIA prefix + exactly 16 uppercase alphanumeric chars (no 'example' substring)
    const content = "aws_key = AKIAI44QH8DHBN7WQRTZ";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "AWS Key")).toBe(true);
  });

  it("detects database URLs with credentials", () => {
    const content = "DATABASE_URL=postgres://user:password@localhost:5432/db";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "Database URL")).toBe(true);
  });

  it("detects private key headers", () => {
    const content = "-----BEGIN RSA PRIVATE KEY-----\nMIIEow...";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "Private Key")).toBe(true);
  });

  it("detects SSH keys", () => {
    const content = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vbqajDRbKEpfONNevLCx+FbGa+T user@host";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "SSH Key")).toBe(true);
  });

  it("detects passwords in key-value format", () => {
    // Build dynamically to avoid secret scanners flagging test fixtures
    const content = `password = '${["super", "Secret", "Password123!"].join("")}'`;
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "Password")).toBe(true);
  });

  it("ignores template variables as false positives", () => {
    const content = "api_key = {{API_KEY}}";
    const matches = detectSensitiveData(content);
    expect(matches).toEqual([]);
  });

  it("ignores environment variable references as false positives", () => {
    const content = "const key = process.env.API_KEY;";
    const matches = detectSensitiveData(content);
    expect(matches).toEqual([]);
  });

  it("ignores placeholder values", () => {
    const content = "api_key = your_api_key_here";
    const matches = detectSensitiveData(content);
    expect(matches).toEqual([]);
  });

  it("ignores LynxPrompt template variables", () => {
    const content = "token = [[AUTH_TOKEN]]";
    const matches = detectSensitiveData(content);
    expect(matches).toEqual([]);
  });

  it("ignores common example values", () => {
    const content = "password = 'example_password'";
    const matches = detectSensitiveData(content);
    expect(matches).toEqual([]);
  });

  it("includes line numbers in matches", () => {
    const content = `line1\npassword = '${["real", "Secret99!", "xyz"].join("")}'`;
    const matches = detectSensitiveData(content);
    const pwMatch = matches.find((m) => m.type === "Password");
    expect(pwMatch?.line).toBe(2);
  });

  it("includes suggestions in matches", () => {
    const content = "key=sk-ant-api03-Xt9wQmR7nKpLsD4vYhJbUfGcZeOiAa";
    const matches = detectSensitiveData(content);
    const match = matches.find((m) => m.type === "Anthropic Key");
    expect(match).toBeDefined();
    expect(match!.suggestion).toContain("[[");
  });

  it("deduplicates matches on same line with same type and snippet", () => {
    const content = `password = '${["dup_secret", "_value_x99"].join("")}'`;
    const matches = detectSensitiveData(content);
    const pwMatches = matches.filter((m) => m.type === "Password");
    // Should not have exact duplicates (same line + type + snippet)
    const uniqueKeys = new Set(pwMatches.map((m) => `${m.line}-${m.type}-${m.snippet}`));
    expect(uniqueKeys.size).toBe(pwMatches.length);
  });

  it("detects SendGrid keys", () => {
    // Build test string dynamically to avoid GitHub push protection
    // SG. + 22 chars + . + 43 chars
    const prefix = "SG";
    const part1 = "Xt9wQmR7nKpLsD4vYhJbUf"; // 22 chars
    const part2 = "ZeOiWwRrTtPpAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoQ"; // 43 chars
    const content = `key = ${prefix}.${part1}.${part2}`;
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "SendGrid Key")).toBe(true);
  });

  it("detects Slack tokens", () => {
    const content = "SLACK_BOT=xoxb-8392748572-Xt9wQmR7nK";
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "Slack Token")).toBe(true);
  });

  it("detects NPM tokens", () => {
    // Build dynamically to avoid secret scanners flagging test fixtures
    const prefix = "npm_";
    const body = "Xt9wQmR7nKpLsD4vYhJbUfGcZeOiWwRrTtPp"; // 36 chars
    const content = `NPM_AUTH=${prefix}${body}`;
    const matches = detectSensitiveData(content);
    expect(matches.some((m) => m.type === "NPM Token")).toBe(true);
  });
});

describe("getSensitiveDataSummary", () => {
  it("returns empty string when no matches", () => {
    expect(getSensitiveDataSummary([])).toBe("");
  });

  it("returns summary with count and types", () => {
    const matches = [
      { type: "Password", pattern: "pw", line: 1, snippet: "pw=x" },
      { type: "API Key", pattern: "key", line: 2, snippet: "key=y" },
    ];
    const summary = getSensitiveDataSummary(matches);
    expect(summary).toContain("2");
    expect(summary).toContain("Password");
    expect(summary).toContain("API Key");
  });

  it("uses singular form for single match", () => {
    const matches = [
      { type: "Password", pattern: "pw", line: 1, snippet: "pw=x" },
    ];
    const summary = getSensitiveDataSummary(matches);
    expect(summary).toContain("1 potential sensitive item:");
    expect(summary).not.toContain("items");
  });

  it("uses plural form for multiple matches", () => {
    const matches = [
      { type: "Password", pattern: "pw", line: 1, snippet: "pw=x" },
      { type: "Token", pattern: "tk", line: 2, snippet: "tk=y" },
    ];
    const summary = getSensitiveDataSummary(matches);
    expect(summary).toContain("items");
  });
});
