import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();

vi.mock("../../src/generated/prisma-users/client", () => ({
  PrismaClient: class {
    user = {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    };
    $disconnect = vi.fn();
  },
}));

// tsconfig excludes prisma/seed-*.ts, so import it through a variable to keep
// it out of the type check. The script runs main() on import; wait for it.
const scriptPath = "../../prisma/seed-superadmin";
async function runScript() {
  vi.resetModules();
  await import(/* @vite-ignore */ scriptPath);
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("prisma/seed-superadmin", () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.SUPERADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    process.argv = ["node", "seed-superadmin.ts"];
  });

  afterEach(() => {
    process.argv = originalArgv;
    if (originalEnv === undefined) delete process.env.SUPERADMIN_EMAIL;
    else process.env.SUPERADMIN_EMAIL = originalEnv;
    vi.restoreAllMocks();
  });

  it("looks up and creates the placeholder with the address lowercased and trimmed", async () => {
    process.env.SUPERADMIN_EMAIL = " Admin@Example.com ";
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ email: "admin@example.com" });

    await runScript();

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { email: "admin@example.com", role: "SUPERADMIN" },
    });
  });

  it("promotes the existing lowercase account when the argument has other casing", async () => {
    delete process.env.SUPERADMIN_EMAIL;
    process.argv = ["node", "seed-superadmin.ts", "Admin@Example.COM"];
    mockFindUnique.mockResolvedValue({ id: "u1", email: "admin@example.com" });
    mockUpdate.mockResolvedValue({ email: "admin@example.com" });

    await runScript();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { email: "admin@example.com" },
      data: { role: "SUPERADMIN" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
