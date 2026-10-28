// Minimal stand-in for the LynxPrompt API, used by regression.sh.
// Usage: node mock-api.mjs <port-file>. Writes the port it listens on to <port-file>.
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

let pulls = 0;

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const route = `${req.method} ${url.pathname}`;

  switch (route) {
    // A private blueprint whose cloud copy changes on every fetch, so a diff
    // right after a pull only finds the change if it asks the server
    case "GET /api/v1/blueprints/bp_pull":
      pulls++;
      return json(res, 200, {
        blueprint: {
          id: "bp_pull",
          name: "Pulled",
          description: "",
          type: "AGENTS_MD",
          tier: "SHORT",
          visibility: "PRIVATE",
          content: `# Cloud copy ${pulls}\n`,
        },
      });
    // A proxy error page instead of JSON
    case "GET /api/v1/blueprints/bp_html":
      res.writeHead(502, { "Content-Type": "text/html" });
      return res.end("<html><body>Bad gateway</body></html>");
    case "GET /api/v1/blueprints":
      return json(res, 200, { blueprints: [], total: 0, limit: 50, offset: 0, has_more: false });
    case "POST /api/v1/hierarchies":
      return json(res, 200, { hierarchy: { id: "ha_ci", name: "ci", repository_root: "ci" } });
    // Every create fails, so 'push --all' has a failed file
    case "POST /api/v1/blueprints":
      return json(res, 500, { error: "create failed" });
    case "POST /api/cli-auth/init":
      return json(res, 200, { session_id: "s_ci", auth_url: "http://127.0.0.1:9/never", expires_at: "" });
    case "GET /api/cli-auth/poll":
      return json(res, 200, { status: "expired" });
    default:
      return json(res, 404, { error: `no mock for ${route}` });
  }
});

server.listen(0, "127.0.0.1", () => {
  writeFileSync(process.argv[2], String(server.address().port));
});
