import type { TestLevelOption } from "./types.js";

/**
 * Test levels
 */
export const TEST_LEVELS: TestLevelOption[] = [
  { id: "unit", label: "Unit Tests", description: "Test individual functions/components" },
  { id: "integration", label: "Integration Tests", description: "Test component interactions" },
  { id: "e2e", label: "End-to-End Tests", description: "Test full user flows" },
  { id: "smoke", label: "Smoke Tests", description: "Quick sanity checks" },
  { id: "regression", label: "Regression Tests", description: "Prevent bug recurrence" },
  { id: "performance", label: "Performance Tests", description: "Load and stress testing" },
  { id: "security", label: "Security Tests", description: "Vulnerability scanning" },
  { id: "accessibility", label: "Accessibility Tests", description: "WCAG compliance" },
  { id: "visual", label: "Visual Regression", description: "Screenshot comparison" },
  { id: "contract", label: "Contract Tests", description: "API contract validation" },
];

/**
 * Test frameworks (comprehensive list)
 */
export const TEST_FRAMEWORKS: string[] = [
  // JavaScript/TypeScript
  "Jest",
  "Vitest",
  "Mocha",
  "Jasmine",
  "AVA",
  "Tape",
  "QUnit",
  "Node Test Runner",
  // E2E / Browser
  "Playwright",
  "Cypress",
  "Puppeteer",
  "Selenium",
  "WebdriverIO",
  "TestCafe",
  "Nightwatch",
  // React
  "React Testing Library",
  "Enzyme",
  // Vue
  "Vue Test Utils",
  "Vue Testing Library",
  // Angular
  "Angular Testing",
  "Karma",
  // Python
  "pytest",
  "unittest",
  "nose2",
  "doctest",
  "hypothesis",
  "tox",
  "nox",
  "Robot Framework",
  // Go
  "testing (stdlib)",
  "testify",
  "ginkgo",
  "gomega",
  "gocheck",
  // Rust
  "cargo test",
  "proptest",
  "quickcheck",
  "criterion",
  // Java
  "JUnit",
  "TestNG",
  "Mockito",
  "Spock",
  "Cucumber",
  // .NET
  "xUnit",
  "NUnit",
  "MSTest",
  "SpecFlow",
  // Ruby
  "RSpec",
  "Minitest",
  "Capybara",
  "Cucumber",
  // PHP
  "PHPUnit",
  "Pest",
  "Codeception",
  "Behat",
  // Mobile
  "XCTest",
  "Espresso",
  "Detox",
  "Appium",
  // API
  "Postman",
  "Insomnia",
  "REST Assured",
  "Supertest",
  "httpx",
  // Load
  "k6",
  "Locust",
  "Artillery",
  "JMeter",
  "Gatling",
  // Other
  "Storybook",
  "Chromatic",
  "Percy",
  "Applitools",
];

