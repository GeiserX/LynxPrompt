import chalk from "chalk";
import { clearToken, isAuthenticated, getUser } from "../config.js";

export async function logoutCommand(): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.yellow("You are not currently logged in."));
    return;
  }

  const user = getUser();
  const email = user?.email || "unknown";

  clearToken();

  console.log(chalk.green(`✓ Logged out from ${chalk.bold(email)}`));
  console.log(chalk.gray("  Removed stored credentials"));
}


