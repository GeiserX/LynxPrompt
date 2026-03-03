import * as vscode from "vscode";
import { LynxPromptApi } from "../api";

export async function signOut(api: LynxPromptApi): Promise<void> {
  if (!api.isAuthenticated) {
    vscode.window.showInformationMessage(
      "You are not signed in to LynxPrompt."
    );
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    "Sign out of LynxPrompt?",
    { modal: true },
    "Sign Out"
  );

  if (confirm !== "Sign Out") {
    return;
  }

  await api.clearToken();
  await vscode.commands.executeCommand(
    "setContext",
    "lynxprompt.authenticated",
    false
  );

  vscode.window.showInformationMessage("Signed out of LynxPrompt.");

  // Refresh tree views to clear blueprints
  await vscode.commands.executeCommand("lynxprompt.refreshBlueprints");
}
