import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockValidate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/api-tokens", () => ({ validateApiToken: mockValidate }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: { apiToken: { update: mockUpdate } },
}));

async function revoke(headers: Record<string, string> = {}) {
  const { POST } = await import("@/app/api/cli-auth/revoke/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/cli-auth/revoke", { method: "POST", headers })
  );
}

describe("POST /api/cli-auth/revoke", () => {
  beforeEach(() => {
    mockValidate.mockReset();
    mockUpdate.mockReset();
    mockUpdate.mockResolvedValue({});
  });

  it("revokes the token that authenticated the request", async () => {
    mockValidate.mockResolvedValue({ tokenId: "tok_9", userId: "user_1" });
    const res = await revoke({ Authorization: "Bearer lp_x" });
    expect(res.status).toBe(200);
    expect(mockValidate).toHaveBeenCalledWith("Bearer lp_x");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "tok_9" },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("answers 401 and changes nothing without a valid token", async () => {
    mockValidate.mockResolvedValue(null);
    const res = await revoke();
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
