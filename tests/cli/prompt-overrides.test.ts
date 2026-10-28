import { describe, it, expect } from "vitest";
import { buildPromptOverrides } from "../../cli/src/utils/prompt-overrides";

describe("cli wizard prompt overrides", () => {
  it("reuses every saved draft answer, not only step 1", () => {
    const overrides = buildPromptOverrides(
      { platforms: ["agents"], packageManager: "pnpm", commitSigning: false, orm: null, docStyle: undefined },
      {}
    );
    expect(overrides).toEqual({ platforms: ["agents"], packageManager: "pnpm", commitSigning: false });
  });

  it("lets explicit flags win over the draft and splits --ci-cd", () => {
    const overrides = buildPromptOverrides(
      { license: "apache-2.0", cicd: ["jenkins"] },
      { license: "mit", ciCd: "github_actions, gitlab_ci", projectType: "opensource" }
    );
    expect(overrides).toEqual({
      license: "mit",
      cicd: ["github_actions", "gitlab_ci"],
      projectType: "opensource",
    });
  });
});
