import chalk from "chalk";
import { api } from "../api.js";
import { clearToken, getStoredCredentials } from "../config.js";

export async function logoutCommand(): Promise<void> {
  // Only the token saved by `lynxp login` is ours to revoke; a LYNXPROMPT_TOKEN
  // from the environment is left alone.
  const stored = getStoredCredentials();
  if (!stored) {
    console.log(chalk.yellow("You are not currently logged in."));
    return;
  }

  const revoked = await api.revokeToken(stored.apiUrl, stored.token);
  clearToken();

  const who = stored.email ? `${stored.email} at ${stored.apiUrl}` : stored.apiUrl;
  console.log(chalk.green(`✓ Logged out from ${chalk.bold(who)}`));
  console.log(chalk.gray("  Removed stored credentials"));
  if (!revoked) {
    console.log(
      chalk.yellow(
        `  Could not revoke the token on the server. Revoke it in Settings > API Tokens at ${stored.apiUrl}.`
      )
    );
  }
}
