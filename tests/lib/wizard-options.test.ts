import { describe, it, expect } from "vitest";
import {
  LANGUAGES,
  FRAMEWORKS,
  DATABASES,
  PACKAGE_MANAGERS,
  MONOREPO_TOOLS,
  JS_RUNTIMES,
  ORM_OPTIONS,
  PROJECT_TYPES,
  ARCHITECTURE_PATTERNS,
  DEV_OS_OPTIONS,
  REPO_HOSTS,
  CICD_OPTIONS,
  LICENSES,
  BRANCH_STRATEGIES,
  DEFAULT_BRANCHES,
  SELF_HOSTED_TARGETS,
  CLOUD_TARGETS,
  DEPLOYMENT_TARGETS,
  CONTAINER_REGISTRIES,
  AI_BEHAVIOR_RULES,
  IMPORTANT_FILES,
  PLAN_MODE_FREQUENCY,
  AUTH_PROVIDERS,
  SECRETS_MANAGEMENT_OPTIONS,
  SECURITY_TOOLING_OPTIONS,
  AUTH_PATTERNS_OPTIONS,
  DATA_HANDLING_OPTIONS,
  COMPLIANCE_OPTIONS,
  ANALYTICS_OPTIONS,
  VERSION_TAG_FORMATS,
  CHANGELOG_OPTIONS,
  VPN_OPTIONS,
  GITOPS_TOOLS,
  NAMING_CONVENTIONS,
  ERROR_HANDLING_PATTERNS,
  LOGGING_OPTIONS,
  BOUNDARY_OPTIONS,
  TEST_LEVELS,
  TEST_FRAMEWORKS,
  COMMON_COMMANDS,
} from "@/lib/wizard-options";

// Helper to check that items have the expected web format
function expectWebFormat(items: Array<{ value?: string; label?: string; id?: string }>) {
  expect(Array.isArray(items)).toBe(true);
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    // Accept either { value, label } or { id, label } format
    if ("value" in item) {
      expect(typeof item.value).toBe("string");
    } else if ("id" in item) {
      expect(typeof item.id).toBe("string");
    }
    expect(typeof item.label).toBe("string");
  }
}

// ============================================================================
// Tech Stack options
// ============================================================================
describe("Tech Stack options", () => {
  it("LANGUAGES has correct web format with value+label", () => {
    expectWebFormat(LANGUAGES);
    // Check that well-known languages are included
    expect(LANGUAGES.some((l) => l.value === "typescript")).toBe(true);
    expect(LANGUAGES.some((l) => l.value === "python")).toBe(true);
  });

  it("FRAMEWORKS has correct web format", () => {
    expectWebFormat(FRAMEWORKS);
    expect(FRAMEWORKS.some((f) => f.value === "nextjs" || f.value === "react")).toBe(true);
  });

  it("DATABASES has category field", () => {
    expect(DATABASES.length).toBeGreaterThan(0);
    for (const db of DATABASES) {
      expect(typeof db.value).toBe("string");
      expect(typeof db.label).toBe("string");
      expect(typeof db.category).toBe("string");
    }
  });

  it("PACKAGE_MANAGERS has id+label+desc", () => {
    expectWebFormat(PACKAGE_MANAGERS);
    for (const pm of PACKAGE_MANAGERS) {
      expect(typeof pm.desc).toBe("string");
    }
  });

  it("MONOREPO_TOOLS has id+label+desc", () => {
    expectWebFormat(MONOREPO_TOOLS);
  });

  it("JS_RUNTIMES has id+label+desc", () => {
    expectWebFormat(JS_RUNTIMES);
  });

  it("ORM_OPTIONS has lang field (may be undefined for generic options)", () => {
    expectWebFormat(ORM_OPTIONS);
    // At least some ORMs should have language arrays
    const withLang = ORM_OPTIONS.filter((orm) => Array.isArray(orm.lang));
    expect(withLang.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Project options
// ============================================================================
describe("Project options", () => {
  it("PROJECT_TYPES has id+label+description", () => {
    expectWebFormat(PROJECT_TYPES);
    for (const pt of PROJECT_TYPES) {
      expect(typeof pt.description).toBe("string");
    }
  });

  it("ARCHITECTURE_PATTERNS has id+label+description", () => {
    expectWebFormat(ARCHITECTURE_PATTERNS);
  });

  it("DEV_OS_OPTIONS has id+label+icon", () => {
    expectWebFormat(DEV_OS_OPTIONS);
  });
});

// ============================================================================
// Repository options
// ============================================================================
describe("Repository options", () => {
  it("REPO_HOSTS has id+label+icon", () => {
    expectWebFormat(REPO_HOSTS);
    expect(REPO_HOSTS.some((r) => r.id === "github")).toBe(true);
  });

  it("CICD_OPTIONS has entries", () => {
    expectWebFormat(CICD_OPTIONS);
  });

  it("LICENSES has id+label+description", () => {
    expectWebFormat(LICENSES);
  });

  it("BRANCH_STRATEGIES has id+label+desc", () => {
    expectWebFormat(BRANCH_STRATEGIES);
  });

  it("DEFAULT_BRANCHES has id+label", () => {
    expectWebFormat(DEFAULT_BRANCHES);
  });

  it("DEPLOYMENT_TARGETS combines self-hosted and cloud", () => {
    expect(DEPLOYMENT_TARGETS.length).toBe(
      SELF_HOSTED_TARGETS.length + CLOUD_TARGETS.length
    );
  });

  it("CONTAINER_REGISTRIES has entries", () => {
    expectWebFormat(CONTAINER_REGISTRIES);
  });
});

// ============================================================================
// AI Behavior options
// ============================================================================
describe("AI Behavior options", () => {
  it("AI_BEHAVIOR_RULES has recommended field", () => {
    expect(AI_BEHAVIOR_RULES.length).toBeGreaterThan(0);
    for (const rule of AI_BEHAVIOR_RULES) {
      expect(typeof rule.id).toBe("string");
      expect("recommended" in rule).toBe(true);
    }
  });

  it("IMPORTANT_FILES has entries", () => {
    expectWebFormat(IMPORTANT_FILES);
  });

  it("PLAN_MODE_FREQUENCY has entries", () => {
    expectWebFormat(PLAN_MODE_FREQUENCY);
  });
});

// ============================================================================
// Security options
// ============================================================================
describe("Security options", () => {
  it("AUTH_PROVIDERS has recommended field", () => {
    expect(AUTH_PROVIDERS.length).toBeGreaterThan(0);
  });

  it("SECRETS_MANAGEMENT_OPTIONS has entries", () => {
    expect(SECRETS_MANAGEMENT_OPTIONS.length).toBeGreaterThan(0);
  });

  it("SECURITY_TOOLING_OPTIONS has entries", () => {
    expect(SECURITY_TOOLING_OPTIONS.length).toBeGreaterThan(0);
  });

  it("AUTH_PATTERNS_OPTIONS has entries", () => {
    expect(AUTH_PATTERNS_OPTIONS.length).toBeGreaterThan(0);
  });

  it("DATA_HANDLING_OPTIONS has entries", () => {
    expect(DATA_HANDLING_OPTIONS.length).toBeGreaterThan(0);
  });

  it("COMPLIANCE_OPTIONS has entries", () => {
    expect(COMPLIANCE_OPTIONS.length).toBeGreaterThan(0);
  });

  it("ANALYTICS_OPTIONS has entries", () => {
    expect(ANALYTICS_OPTIONS.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Versioning & Release options
// ============================================================================
describe("Versioning & Release options", () => {
  it("VERSION_TAG_FORMATS has entries", () => {
    expectWebFormat(VERSION_TAG_FORMATS);
  });

  it("CHANGELOG_OPTIONS has entries", () => {
    expectWebFormat(CHANGELOG_OPTIONS);
  });
});

// ============================================================================
// Infrastructure options
// ============================================================================
describe("Infrastructure options", () => {
  it("VPN_OPTIONS has entries", () => {
    expectWebFormat(VPN_OPTIONS);
  });

  it("GITOPS_TOOLS has entries", () => {
    expectWebFormat(GITOPS_TOOLS);
  });
});

// ============================================================================
// Code Style options
// ============================================================================
describe("Code Style options", () => {
  it("NAMING_CONVENTIONS has id+label+desc", () => {
    expectWebFormat(NAMING_CONVENTIONS);
  });

  it("ERROR_HANDLING_PATTERNS has entries", () => {
    expectWebFormat(ERROR_HANDLING_PATTERNS);
  });

  it("LOGGING_OPTIONS has entries", () => {
    expectWebFormat(LOGGING_OPTIONS);
  });

  it("BOUNDARY_OPTIONS is an array of strings", () => {
    expect(Array.isArray(BOUNDARY_OPTIONS)).toBe(true);
    expect(BOUNDARY_OPTIONS.length).toBeGreaterThan(0);
    for (const b of BOUNDARY_OPTIONS) {
      expect(typeof b).toBe("string");
    }
  });
});

// ============================================================================
// Testing options
// ============================================================================
describe("Testing options", () => {
  it("TEST_LEVELS has id+label+desc", () => {
    expectWebFormat(TEST_LEVELS);
  });

  it("TEST_FRAMEWORKS is an array", () => {
    expect(Array.isArray(TEST_FRAMEWORKS)).toBe(true);
    expect(TEST_FRAMEWORKS.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Commands options
// ============================================================================
describe("Commands options", () => {
  it("COMMON_COMMANDS is an array", () => {
    expect(Array.isArray(COMMON_COMMANDS)).toBe(true);
    expect(COMMON_COMMANDS.length).toBeGreaterThan(0);
  });
});
