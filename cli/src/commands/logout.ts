import chalk from "chalk";
import { api } from "../api.js";
import {
  clearToken,
  getApiUrl,
  getOtherLoggedInUrls,
  getStoredCredentials,
} from "../config.js";

export async function logoutCommand(): Promise<void> {
  // Only the token saved by `lynxp login` is ours to revoke; a LYNXPROMPT_TOKEN
  // from the environment is left alone.
  const stored = getStoredCredentials();
  if (!stored) {
    console.log(chalk.yellow(`You are not logged in at ${getApiUrl()}.`));
    printOtherLogins();
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
  printOtherLogins();
}

// Each server keeps its own login; say which ones this logout did not touch.
function printOtherLogins(): void {
  const others = getOtherLoggedInUrls();
  if (others.length === 0) return;
  console.log(chalk.gray(`  Still logged in at: ${others.join(", ")}`));
  console.log(chalk.gray("  Switch with 'lynxp config set-url <url>' and run 'lynxp logout' there."));
}
