import * as vscode from "vscode";
import { LynxPromptApi } from "./api";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 300_000; // 5 minutes

export async function performDeviceAuth(api: LynxPromptApi): Promise<boolean> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "LynxPrompt: Signing in...",
      cancellable: true,
    },
    async (progress, cancellationToken) => {
      try {
        progress.report({ message: "Initiating device authentication..." });

        const initResponse = await api.initDeviceAuth();

        // Open browser for user to sign in
        const opened = await vscode.env.openExternal(
          vscode.Uri.parse(initResponse.auth_url)
        );
        if (!opened) {
          vscode.window.showErrorMessage(
            "Failed to open browser. Please visit: " + initResponse.auth_url
          );
        }

        progress.report({
          message: "Waiting for browser authentication...",
        });

        // Poll for completion
        const startTime = Date.now();
        while (
          !cancellationToken.isCancellationRequested &&
          Date.now() - startTime < MAX_POLL_DURATION_MS
        ) {
          await sleep(POLL_INTERVAL_MS);

          const pollResponse = await api.pollDeviceAuth(
            initResponse.session_id
          );

          if (pollResponse.status === "completed" && pollResponse.token) {
            await api.setToken(pollResponse.token);
            return true;
          }

          if (pollResponse.status === "expired") {
            vscode.window.showErrorMessage(
              "Authentication session expired. Please try again."
            );
            return false;
          }

          // status === "pending" -- continue polling
        }

        if (cancellationToken.isCancellationRequested) {
          vscode.window.showInformationMessage(
            "LynxPrompt sign-in cancelled."
          );
        } else {
          vscode.window.showErrorMessage(
            "Authentication timed out. Please try again."
          );
        }

        return false;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(
          `LynxPrompt sign-in failed: ${message}`
        );
        return false;
      }
    }
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
