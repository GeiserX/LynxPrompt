/**
 * The Cloud Sync instructions written into a synced rules file: how to push
 * and pull it with the CLI, signed in with lynxp login or with an API token
 * taken from an environment variable. The web wizard and the CLI both
 * write them, so a synced file reads the same whichever made it.
 */

const CLI_DEFAULT_API_URL = "https://lynxprompt.com";

/** Blueprint API ids carry a "bp_" prefix; the database id does not. */
export function toBlueprintApiId(id: string): string {
  return id.startsWith("bp_") ? id : `bp_${id}`;
}

export interface ApiSyncHeaderOptions {
  blueprintId: string;
  fileName: string;
  appUrl: string;
  preferCliSync: boolean;
  tokenEnvVar?: string;
}

function syncInstructions(opts: ApiSyncHeaderOptions): string[] {
  const bpId = toBlueprintApiId(opts.blueprintId);
  const file = opts.fileName;
  const appUrl = opts.appUrl.replace(/\/+$/, "");
  const token = opts.tokenEnvVar || "LYNXPROMPT_API_TOKEN";
  const lines = [
    "LynxPrompt Cloud Sync",
    `Blueprint ID: ${bpId}`,
    "This file is synced with LynxPrompt.",
    "",
  ];

  lines.push(
    opts.preferCliSync
      ? "Using the LynxPrompt CLI (recommended, no token in this file):"
      : `Using the LynxPrompt CLI, with the API token in $${token} (never put the token in this file):`,
    "  npm install -g lynxprompt",
  );
  // A token is only good on the server that issued it, so token mode always
  // names it rather than trusting a URL saved in the CLI's config.
  if (!opts.preferCliSync || appUrl !== CLI_DEFAULT_API_URL) {
    lines.push(`  export LYNXPROMPT_API_URL=${appUrl}`);
  }
  if (opts.preferCliSync) {
    lines.push(
      "  lynxp login",
      `  lynxp link ${file} ${bpId}   # once: track this file without overwriting it`,
      `  lynxp push ${file}   # upload local changes`,
      `  lynxp pull ${bpId}   # download cloud changes`,
      `  lynxp diff ${file}   # compare local and cloud`,
    );
  } else {
    if (token !== "LYNXPROMPT_TOKEN") lines.push(`  export LYNXPROMPT_TOKEN="$${token}"`);
    lines.push(
      `  lynxp pull ${bpId} --yes   # download cloud changes into ${file}`,
      `  lynxp push ${file}   # upload local changes`,
    );
  }

  lines.push("", `Generate an API token at: ${appUrl}/settings`, `Docs: ${appUrl}/docs/api`);
  return lines;
}

/**
 * Put the Cloud Sync instructions into a downloaded file as a comment the
 * file format allows: an HTML comment for Markdown, MDC and plain-text rules
 * (after the frontmatter, which must stay first), "#" lines for YAML and TOML.
 * JSON has no comments, so a JSON file is returned unchanged.
 */
export function addApiSyncHeader(content: string, opts: ApiSyncHeaderOptions): string {
  const ext = opts.fileName.toLowerCase().split(".").pop() || "";
  if (ext === "json") return content;

  const lines = syncInstructions(opts);
  if (ext === "yaml" || ext === "yml" || ext === "toml") {
    return lines.map((l) => (l ? `# ${l}` : "#")).join("\n") + "\n\n" + content;
  }

  const block = ["<!--", ...lines, "-->", ""].join("\n");
  const frontmatter = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (frontmatter) {
    return frontmatter[0] + "\n" + block + "\n" + content.slice(frontmatter[0].length);
  }
  return block + "\n" + content;
}
