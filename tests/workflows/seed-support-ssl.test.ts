// @vitest-environment node
import { spawn } from "node:child_process";
import { createServer, type AddressInfo } from "node:net";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// With DB_SSL=true the app's pools use TLS, but the support seed connected in
// plaintext, so a database that refuses plaintext rejected it at every start
// and the forum had no categories. A fake server reads the first message the
// seed sends: a TLS-capable client opens with SSLRequest (length 8, code 80877103).
const tsx = resolve(process.cwd(), "node_modules/.bin/tsx");

async function firstMessage(env: Record<string, string>): Promise<Buffer> {
  let first: Buffer = Buffer.alloc(0);
  const server = createServer((socket) => {
    socket.once("data", (data) => {
      first = data;
      socket.destroy();
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  const child = spawn(tsx, ["prisma/seed-support.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL_SUPPORT: `postgresql://seed:seed@127.0.0.1:${port}/seed`,
      ...env,
    },
    stdio: "ignore",
  });
  await new Promise((r) => child.on("exit", r));
  server.close();
  return first;
}

const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 0x04, 0xd2, 0x16, 0x2f]);

describe("support seed TLS", () => {
  it("asks for TLS when DB_SSL is true", async () => {
    const first = await firstMessage({ DB_SSL: "true", DB_SSL_REJECT_UNAUTHORIZED: "false" });
    expect(first.subarray(0, 8)).toEqual(SSL_REQUEST);
  }, 60_000);

  it("connects in plaintext when DB_SSL is off (control)", async () => {
    const first = await firstMessage({ DB_SSL: "" });
    expect(first.length).toBeGreaterThan(8);
    expect(first.subarray(0, 8)).not.toEqual(SSL_REQUEST);
  }, 60_000);
});
