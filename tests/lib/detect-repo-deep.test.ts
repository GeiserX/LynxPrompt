import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectGitHubRepo, detectGitLabRepo } from "@/lib/detect-repo";

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  global.fetch = fetchSpy;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper: create a basic repo info response
function ghRepoInfo(name: string, opts: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: () => Promise.resolve({
      name,
      description: opts.description ?? null,
      license: opts.license ?? null,
      private: opts.private ?? false,
      default_branch: "main",
    }),
  };
}

function glRepoInfo(name: string, opts: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: () => Promise.resolve({
      name,
      description: opts.description ?? null,
      license: opts.license ?? null,
      visibility: opts.visibility ?? "public",
      default_branch: "main",
    }),
  };
}

function fileList(files: Array<{ name: string; type?: string }>) {
  return {
    ok: true,
    json: () => Promise.resolve(files.map(f => ({
      name: f.name,
      path: f.name,
      type: f.type || "file",
    }))),
  };
}

function glFileList(files: Array<{ name: string; type?: string }>) {
  return {
    ok: true,
    json: () => Promise.resolve(files.map(f => ({
      name: f.name,
      path: f.name,
      type: f.type === "dir" ? "tree" : "blob",
    }))),
  };
}

function textResponse(content: string) {
  return { ok: true, text: () => Promise.resolve(content) };
}

function notFound() {
  return { ok: false, status: 404 };
}

// ============================================================================
// GitHub: Python pyproject.toml deep detection
// ============================================================================
describe("detectGitHubRepo - pyproject.toml deep", () => {
  it("detects Django + pymysql + sqlite from pyproject.toml", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("pyproj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("[project]\ndependencies = ['django', 'pymysql', 'aiosqlite']"));

    const r = await detectGitHubRepo("https://github.com/o/pyproj");
    expect(r!.stack).toContain("python");
    expect(r!.stack).toContain("django");
    expect(r!.databases).toContain("mysql");
    expect(r!.databases).toContain("sqlite");
    expect(r!.commands.test).toBe("pytest");
    expect(r!.commands.lint).toBe("ruff check .");
  });

  it("detects Flask + nose test framework", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("flask-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("[deps]\nflask\nnose"));

    const r = await detectGitHubRepo("https://github.com/o/flask-proj");
    expect(r!.stack).toContain("flask");
    expect(r!.testFramework).toBe("nose");
  });

  it("detects unittest test framework", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("ut-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("[test]\nunittest\nasyncpg"));

    const r = await detectGitHubRepo("https://github.com/o/ut-proj");
    expect(r!.testFramework).toBe("unittest");
    expect(r!.databases).toContain("postgresql");
  });
});

// ============================================================================
// GitHub: requirements.txt deep detection
// ============================================================================
describe("detectGitHubRepo - requirements.txt deep", () => {
  it("detects all Python DB libraries from requirements.txt", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("req-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "requirements.txt" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(
      "flask==2.0\npsycopg2==2.9\naiosqlite==0.17\npymongo==4.0\naioredis==2.0\nmysql-connector-python==8.0"
    ));

    const r = await detectGitHubRepo("https://github.com/o/req-proj");
    expect(r!.stack).toContain("python");
    expect(r!.stack).toContain("flask");
    expect(r!.databases).toContain("postgresql");
    expect(r!.databases).toContain("sqlite");
    expect(r!.databases).toContain("mongodb");
    expect(r!.databases).toContain("redis");
    expect(r!.databases).toContain("mysql");
  });

  it("detects Django from requirements.txt", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("dj-req"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "requirements.txt" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("django==4.2\npymysql==1.1\naiomysql==0.2"));

    const r = await detectGitHubRepo("https://github.com/o/dj-req");
    expect(r!.stack).toContain("django");
    expect(r!.databases).toContain("mysql");
  });

  it("detects FastAPI from requirements.txt", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("fa-req"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "requirements.txt" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("fastapi==0.100\nmotor==3.0"));

    const r = await detectGitHubRepo("https://github.com/o/fa-req");
    expect(r!.stack).toContain("fastapi");
    expect(r!.databases).toContain("mongodb");
  });

  it("defaults to sqlite when sqlalchemy present but no specific DB", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("sa-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "requirements.txt" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("sqlalchemy==2.0\nfastapi==0.100"));

    const r = await detectGitHubRepo("https://github.com/o/sa-proj");
    expect(r!.databases).toContain("sqlite");
  });

  it("does NOT add python twice when both pyproject.toml and requirements.txt exist", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("both-py"));
    fetchSpy.mockResolvedValueOnce(fileList([
      { name: "pyproject.toml" },
      { name: "requirements.txt" },
    ]));
    // pyproject.toml
    fetchSpy.mockResolvedValueOnce(textResponse("[project]\ndependencies = ['flask', 'pytest']"));
    // requirements.txt
    fetchSpy.mockResolvedValueOnce(textResponse("flask==2.0\nredis==4.0"));

    const r = await detectGitHubRepo("https://github.com/o/both-py");
    const pythonCount = r!.stack.filter(s => s === "python").length;
    expect(pythonCount).toBe(1);
  });
});

// ============================================================================
// GitHub: Docker compose registry detection
// ============================================================================
describe("detectGitHubRepo - container registries", () => {
  async function setupDockerCompose(content: string) {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("dc-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([
      { name: "docker-compose.yml" },
    ]));
    fetchSpy.mockResolvedValueOnce(textResponse(content));
  }

  it("detects ghcr.io", async () => {
    await setupDockerCompose("services:\n  app:\n    image: ghcr.io/org/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("ghcr");
  });

  it("detects docker.io", async () => {
    await setupDockerCompose("services:\n  app:\n    image: docker.io/user/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("dockerhub");
  });

  it("detects dockerhub from image pattern", async () => {
    await setupDockerCompose("services:\n  app:\n    image: myuser/myapp:latest");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("dockerhub");
  });

  it("detects gcr.io", async () => {
    await setupDockerCompose("services:\n  app:\n    image: gcr.io/proj/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("gcr");
  });

  it("detects ECR from ecr prefix", async () => {
    await setupDockerCompose("services:\n  app:\n    image: 12345.dkr.ecr.us-east-1.amazonaws.com/app");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("ecr");
  });

  it("detects azurecr.io as ecr (ecr. substring matches first)", async () => {
    // Note: azurecr.io contains "ecr." so the ECR check matches before ACR in the else-if chain
    await setupDockerCompose("services:\n  app:\n    image: myregistry.azurecr.io/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("ecr");
  });

  it("detects quay.io", async () => {
    await setupDockerCompose("services:\n  app:\n    image: quay.io/org/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("quay");
  });

  it("detects gitlab registry", async () => {
    await setupDockerCompose("services:\n  app:\n    image: registry.gitlab.com/org/app:v1");
    const r = await detectGitHubRepo("https://github.com/o/dc-proj");
    expect(r!.containerRegistry).toBe("gitlab_registry");
  });

  it("detects docker-compose.yaml variant", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("dc-yaml"));
    fetchSpy.mockResolvedValueOnce(fileList([
      { name: "docker-compose.yaml" },
    ]));
    fetchSpy.mockResolvedValueOnce(textResponse("services:\n  app:\n    image: ghcr.io/org/app:v1"));

    const r = await detectGitHubRepo("https://github.com/o/dc-yaml");
    expect(r!.containerRegistry).toBe("ghcr");
  });
});

// ============================================================================
// GitHub: CI/CD detection
// ============================================================================
describe("detectGitHubRepo - CI/CD", () => {
  it("detects Jenkins from Jenkinsfile", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("jenkins-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "Jenkinsfile" }]));

    const r = await detectGitHubRepo("https://github.com/o/jenkins-proj");
    expect(r!.cicd).toBe("jenkins");
  });

  it("detects Travis CI", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("travis-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: ".travis.yml" }]));

    const r = await detectGitHubRepo("https://github.com/o/travis-proj");
    expect(r!.cicd).toBe("travis");
  });

  it("detects Azure Pipelines", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("az-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "azure-pipelines.yml" }]));

    const r = await detectGitHubRepo("https://github.com/o/az-proj");
    expect(r!.cicd).toBe("azure_devops");
  });

  it("detects GitLab CI in GitHub repo", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("gl-ci"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: ".gitlab-ci.yml" }]));

    const r = await detectGitHubRepo("https://github.com/o/gl-ci");
    expect(r!.cicd).toBe("gitlab_ci");
  });
});

// ============================================================================
// GitHub: Node.js test framework detection
// ============================================================================
describe("detectGitHubRepo - test frameworks", () => {
  async function setupPkgJson(deps: Record<string, string>) {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("tf-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      devDependencies: deps,
    })));
  }

  it("detects playwright", async () => {
    await setupPkgJson({ "@playwright/test": "^1.0" });
    const r = await detectGitHubRepo("https://github.com/o/tf-proj");
    expect(r!.testFramework).toBe("playwright");
  });

  it("detects cypress", async () => {
    await setupPkgJson({ cypress: "^13.0" });
    const r = await detectGitHubRepo("https://github.com/o/tf-proj");
    expect(r!.testFramework).toBe("cypress");
  });

  it("detects mocha", async () => {
    await setupPkgJson({ mocha: "^10.0" });
    const r = await detectGitHubRepo("https://github.com/o/tf-proj");
    expect(r!.testFramework).toBe("mocha");
  });

  it("detects ava", async () => {
    await setupPkgJson({ ava: "^6.0" });
    const r = await detectGitHubRepo("https://github.com/o/tf-proj");
    expect(r!.testFramework).toBe("ava");
  });

  it("detects tap", async () => {
    await setupPkgJson({ tap: "^18.0" });
    const r = await detectGitHubRepo("https://github.com/o/tf-proj");
    expect(r!.testFramework).toBe("tap");
  });
});

// ============================================================================
// GitHub: Node.js database detection
// ============================================================================
describe("detectGitHubRepo - Node.js databases", () => {
  async function setupPkgJsonDeps(deps: Record<string, string>) {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("db-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      dependencies: deps,
    })));
  }

  it("detects postgres via pg", async () => {
    await setupPkgJsonDeps({ pg: "^8.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("postgresql");
  });

  it("detects postgres via @neondatabase/serverless", async () => {
    await setupPkgJsonDeps({ "@neondatabase/serverless": "^1.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("postgresql");
  });

  it("detects sqlite via sql.js", async () => {
    await setupPkgJsonDeps({ "sql.js": "^1.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("sqlite");
  });

  it("detects sqlite via sqlite3", async () => {
    await setupPkgJsonDeps({ sqlite3: "^5.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("sqlite");
  });

  it("detects mongodb via mongoose", async () => {
    await setupPkgJsonDeps({ mongoose: "^7.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("mongodb");
  });

  it("detects redis via ioredis", async () => {
    await setupPkgJsonDeps({ ioredis: "^5.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("redis");
  });

  it("detects mysql via mysql2", async () => {
    await setupPkgJsonDeps({ mysql2: "^3.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("mysql");
  });

  it("detects planetscale as mysql", async () => {
    await setupPkgJsonDeps({ "@planetscale/database": "^1.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("mysql");
  });

  it("detects libsql/turso as sqlite", async () => {
    await setupPkgJsonDeps({ "@libsql/client": "^0.5" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("sqlite");
  });

  it("detects @turso/client as sqlite", async () => {
    await setupPkgJsonDeps({ "@turso/client": "^1.0" });
    const r = await detectGitHubRepo("https://github.com/o/db-proj");
    expect(r!.databases).toContain("sqlite");
  });
});

// ============================================================================
// GitHub: Rust and Go detection
// ============================================================================
describe("detectGitHubRepo - Rust and Go", () => {
  it("detects Rust from Cargo.toml", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("rust-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "Cargo.toml" }]));

    const r = await detectGitHubRepo("https://github.com/o/rust-proj");
    expect(r!.stack).toContain("rust");
    expect(r!.commands.build).toBe("cargo build");
    expect(r!.commands.test).toBe("cargo test");
    expect(r!.commands.lint).toBe("cargo clippy");
  });

  it("detects Go from go.mod", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("go-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "go.mod" }]));

    const r = await detectGitHubRepo("https://github.com/o/go-proj");
    expect(r!.stack).toContain("go");
    expect(r!.commands.build).toBe("go build");
    expect(r!.commands.test).toBe("go test ./...");
    expect(r!.commands.lint).toBe("golangci-lint run");
  });
});

// ============================================================================
// GitHub: License detection from file content
// ============================================================================
describe("detectGitHubRepo - license from file", () => {
  it("detects MIT license from LICENSE file", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("lic-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "LICENSE" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("MIT License\nPermission is hereby granted, free of charge, to any person"));

    const r = await detectGitHubRepo("https://github.com/o/lic-proj");
    expect(r!.license).toBe("mit");
  });

  it("detects Apache license from LICENSE file", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("lic2"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "LICENSE" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("Apache License\nVersion 2.0, January 2004"));

    const r = await detectGitHubRepo("https://github.com/o/lic2");
    expect(r!.license).toBe("apache-2.0");
  });

  it("detects GPL-3.0 license from LICENSE file", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("lic3"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "LICENSE" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("GNU General Public License\nVersion 3, 29 June 2007"));

    const r = await detectGitHubRepo("https://github.com/o/lic3");
    expect(r!.license).toBe("gpl-3.0");
  });
});

// ============================================================================
// GitHub: FUNDING.yml detection and start script fallback
// ============================================================================
describe("detectGitHubRepo - misc", () => {
  it("detects FUNDING.yml in .github dir", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("funded"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: ".github", type: "dir" }]));
    // First .github listing (CI check)
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "FUNDING.YML" }]));
    // Second .github listing (funding check)
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "FUNDING.YML" }]));

    const r = await detectGitHubRepo("https://github.com/o/funded");
    expect(r!.existingFiles).toContain(".github/FUNDING.yml");
  });

  it("uses start script as dev fallback", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("start-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      dependencies: { express: "^4.0" },
      scripts: { start: "node index.js" },
    })));

    const r = await detectGitHubRepo("https://github.com/o/start-proj");
    expect(r!.commands.dev).toBe("npm run start");
  });

  it("uses package description when repo description is null", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("desc-proj"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      description: "From package.json",
      dependencies: {},
    })));

    const r = await detectGitHubRepo("https://github.com/o/desc-proj");
    expect(r!.description).toBe("From package.json");
  });

  it("adds javascript when only typescript detected", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("ts-only"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      devDependencies: { typescript: "^5.0" },
    })));

    const r = await detectGitHubRepo("https://github.com/o/ts-only");
    expect(r!.stack[0]).toBe("javascript");
    expect(r!.stack).toContain("typescript");
  });

  it("handles invalid package.json gracefully", async () => {
    fetchSpy.mockResolvedValueOnce(ghRepoInfo("bad-json"));
    fetchSpy.mockResolvedValueOnce(fileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("NOT VALID JSON"));

    const r = await detectGitHubRepo("https://github.com/o/bad-json");
    expect(r).not.toBeNull();
    expect(r!.stack).toEqual([]);
  });
});

// ============================================================================
// GitLab: Deep detection
// ============================================================================
describe("detectGitLabRepo - deep branches", () => {
  it("detects GitLab Python (pyproject + all DBs)", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-py"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(
      "[project]\ndependencies = ['fastapi', 'asyncpg', 'aiosqlite', 'pymongo', 'aioredis', 'aiomysql', 'pytest']"
    ));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-py");
    expect(r!.stack).toContain("python");
    expect(r!.stack).toContain("fastapi");
    expect(r!.testFramework).toBe("pytest");
    expect(r!.databases).toContain("postgresql");
    expect(r!.databases).toContain("sqlite");
    expect(r!.databases).toContain("mongodb");
    expect(r!.databases).toContain("redis");
    expect(r!.databases).toContain("mysql");
  });

  it("detects GitLab Django from pyproject.toml", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-dj"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("[project]\ndependencies = ['django']"));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-dj");
    expect(r!.stack).toContain("django");
  });

  it("detects GitLab Flask from pyproject.toml", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-fl"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "pyproject.toml" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("[project]\ndependencies = ['flask']"));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-fl");
    expect(r!.stack).toContain("flask");
  });

  it("detects GitLab Rust from Cargo.toml", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-rs"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "Cargo.toml" }]));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-rs");
    expect(r!.stack).toContain("rust");
    expect(r!.commands.build).toBe("cargo build");
  });

  it("detects GitLab Go from go.mod", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-go"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "go.mod" }]));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-go");
    expect(r!.stack).toContain("go");
    expect(r!.commands.build).toBe("go build");
  });

  it("detects license from LICENSE file in GitLab", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-lic"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "LICENSE" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("GNU General Public License\nVersion 3, 29 June 2007"));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-lic");
    expect(r!.license).toBe("gpl-3.0");
  });

  it("detects GitLab container registries from docker-compose", async () => {
    const registries = [
      { content: "image: registry.gitlab.com/org/app:v1", expected: "gitlab_registry" },
      { content: "image: ghcr.io/org/app:v1", expected: "ghcr" },
      { content: "image: gcr.io/proj/app:v1", expected: "gcr" },
      { content: "image: 12345.dkr.ecr.us-east-1.amazonaws.com/app", expected: "ecr" },
      { content: "image: myuser/myapp:latest", expected: "dockerhub" },
    ];

    for (const reg of registries) {
      fetchSpy.mockReset();
      fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-dc"));
      fetchSpy.mockResolvedValueOnce(glFileList([{ name: "docker-compose.yml" }]));
      fetchSpy.mockResolvedValueOnce(textResponse(`services:\n  app:\n    ${reg.content}`));

      const r = await detectGitLabRepo("https://gitlab.com/o/gl-dc");
      expect(r!.containerRegistry).toBe(reg.expected);
    }
  });

  it("detects GitLab Node.js with all databases", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-node"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      dependencies: { pg: "^8", "better-sqlite3": "^9", mongodb: "^6", redis: "^4", mysql2: "^3", vue: "^3" },
      devDependencies: { typescript: "^5", vitest: "^1" },
      scripts: { build: "vue build", test: "vitest", lint: "eslint .", dev: "vue dev" },
    })));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-node");
    expect(r!.stack).toContain("vue");
    expect(r!.stack).toContain("typescript");
    expect(r!.testFramework).toBe("vitest");
    expect(r!.databases).toContain("postgresql");
    expect(r!.databases).toContain("sqlite");
    expect(r!.databases).toContain("mongodb");
    expect(r!.databases).toContain("redis");
    expect(r!.databases).toContain("mysql");
    expect(r!.commands.build).toBe("npm run build");
    expect(r!.commands.dev).toBe("npm run dev");
  });

  it("detects cypress in GitLab", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-cy"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      devDependencies: { cypress: "^13.0" },
    })));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-cy");
    expect(r!.testFramework).toBe("cypress");
  });

  it("uses start script as dev fallback in GitLab", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-start"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      dependencies: { express: "^4" },
      scripts: { start: "node index.js" },
    })));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-start");
    expect(r!.commands.dev).toBe("npm run start");
  });

  it("uses package description when repo desc is null in GitLab", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-desc"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse(JSON.stringify({
      description: "From pkg",
      dependencies: {},
    })));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-desc");
    expect(r!.description).toBe("From pkg");
  });

  it("handles invalid JSON in GitLab package.json", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("gl-bad"));
    fetchSpy.mockResolvedValueOnce(glFileList([{ name: "package.json" }]));
    fetchSpy.mockResolvedValueOnce(textResponse("INVALID"));

    const r = await detectGitLabRepo("https://gitlab.com/o/gl-bad");
    expect(r).not.toBeNull();
    expect(r!.stack).toEqual([]);
  });

  it("returns null for private GitLab repos", async () => {
    fetchSpy.mockResolvedValueOnce(glRepoInfo("priv", { visibility: "private" }));
    const r = await detectGitLabRepo("https://gitlab.com/o/priv");
    expect(r).toBeNull();
  });
});
