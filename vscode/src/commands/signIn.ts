import * as vscode from "vscode";
import { LynxPromptApi } from "../api";
import { performDeviceAuth } from "../auth";

export async function signIn(api: LynxPromptApi): Promise<void> {
  if (api.isAuthenticated) {
    const choice = await vscode.window.showInformationMessage(
      "You are already signed in to LynxPrompt. Sign out first?",
      "Sign Out",
      "Cancel"
    );
    if (choice !== "Sign Out") {
      return;
    }
    await api.clearToken();
    await vscode.commands.executeCommand(
      "setContext",
      "lynxprompt.authenticated",
      false
    );
  }

  const success = await performDeviceAuth(api);
  if (success) {
    await vscode.commands.executeCommand(
      "setContext",
      "lynxprompt.authenticated",
      true
    );

    // Verify by fetching user info
    try {
      const user = await api.getUser();
      vscode.window.showInformationMessage(
        `Signed in to LynxPrompt as ${user.name || user.email}`
      );
    } catch {
      vscode.window.showInformationMessage("Signed in to LynxPrompt.");
    }

    // Refresh tree views
    await vscode.commands.executeCommand("lynxprompt.refreshBlueprints");
  }
}
