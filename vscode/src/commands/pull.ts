import * as vscode from "vscode";
import * as path from "path";
import { LynxPromptApi } from "../api";
import { BlueprintTreeItem } from "../views/blueprintTree";
import { LinkMapping } from "../types";
import { blueprintTypeToPath } from "../utils/fileMapping";

export async function pullBlueprint(
  api: LynxPromptApi,
  linkMappings: Map<string, LinkMapping>,
  item?: BlueprintTreeItem
): Promise<void> {
  if (!api.isAuthenticated) {
    vscode.window.showErrorMessage("Please sign in to LynxPrompt first.");
    return;
  }

  let blueprintId: string;

  if (item instanceof BlueprintTreeItem) {
    blueprintId = item.blueprint.id;
  } else {
    // Prompt the user to pick a blueprint
    const response = await api.listBlueprints(200);
    if (response.blueprints.length === 0) {
      vscode.window.showInformationMessage(
        "You have no blueprints. Create one at lynxprompt.com"
      );
      return;
    }

    const picked = await vscode.window.showQuickPick(
      response.blueprints.map((bp) => ({
        label: bp.name,
        description: `${bp.type} - ${bp.visibility.toLowerCase()}`,
        detail: bp.description || undefined,
        blueprintId: bp.id,
      })),
      {
        placeHolder: "Select a blueprint to pull",
        matchOnDescription: true,
        matchOnDetail: true,
      }
    );

    if (!picked) {
      return;
    }
    blueprintId = picked.blueprintId;
  }

  // Fetch full blueprint content
  const blueprint = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Fetching blueprint...",
    },
    async () => api.getBlueprint(blueprintId)
  );

  // Determine workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage(
      "No workspace folder open. Open a folder first."
    );
    return;
  }

  let targetFolder: vscode.WorkspaceFolder;
  if (workspaceFolders.length === 1) {
    targetFolder = workspaceFolders[0];
  } else {
    const picked = await vscode.window.showWorkspaceFolderPick({
      placeHolder: "Select target workspace folder",
    });
    if (!picked) {
      return;
    }
    targetFolder = picked;
  }

  // Compute target path
  const relativePath = blueprintTypeToPath(blueprint.type, blueprint.name);
  const absolutePath = path.join(targetFolder.uri.fsPath, relativePath);
  const targetUri = vscode.Uri.file(absolutePath);

  // Check if file already exists
  let fileExists = false;
  try {
    await vscode.workspace.fs.stat(targetUri);
    fileExists = true;
  } catch {
    // File doesn't exist
  }

  if (fileExists) {
    // Show diff before overwriting
    const existingContent = await vscode.workspace.fs.readFile(targetUri);
    const existingText = Buffer.from(existingContent).toString("utf-8");

    if (existingText === blueprint.content) {
      vscode.window.showInformationMessage(
        `${relativePath} is already up to date.`
      );
      // Update link mapping
      updateLinkMapping(linkMappings, absolutePath, blueprint.id, blueprint.content_checksum);
      return;
    }

    const choice = await vscode.window.showWarningMessage(
      `${relativePath} already exists and differs from the cloud version. Overwrite?`,
      { modal: false },
      "Overwrite",
      "Show Diff",
      "Cancel"
    );

    if (choice === "Show Diff") {
      // Create a temporary file for diff
      const cloudContent = Buffer.from(blueprint.content, "utf-8");
      const tempDir = path.join(
        targetFolder.uri.fsPath,
        ".lynxprompt-tmp"
      );
      const tempPath = path.join(
        tempDir,
        `${blueprint.id}-cloud${path.extname(relativePath) || ".md"}`
      );
      const tempFileUri = vscode.Uri.file(tempPath);

      await vscode.workspace.fs.createDirectory(vscode.Uri.file(tempDir));
      await vscode.workspace.fs.writeFile(tempFileUri, cloudContent);

      await vscode.commands.executeCommand(
        "vscode.diff",
        targetUri,
        tempFileUri,
        `${relativePath} (Local) <-> ${blueprint.name} (Cloud)`
      );

      // Ask again after showing diff
      const overwrite = await vscode.window.showWarningMessage(
        `Overwrite local ${relativePath} with cloud version?`,
        "Overwrite",
        "Cancel"
      );

      // Clean up temp
      try {
        await vscode.workspace.fs.delete(tempFileUri);
        await vscode.workspace.fs.delete(vscode.Uri.file(tempDir), {
          recursive: true,
        });
      } catch {
        // Ignore cleanup errors
      }

      if (overwrite !== "Overwrite") {
        return;
      }
    } else if (choice !== "Overwrite") {
      return;
    }
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(absolutePath);
  await vscode.workspace.fs.createDirectory(vscode.Uri.file(parentDir));

  // Write file
  const content = Buffer.from(blueprint.content, "utf-8");
  await vscode.workspace.fs.writeFile(targetUri, content);

  // Update link mapping
  updateLinkMapping(linkMappings, absolutePath, blueprint.id, blueprint.content_checksum);

  vscode.window.showInformationMessage(
    `Blueprint "${blueprint.name}" pulled to ${relativePath}`
  );

  // Refresh local files tree
  await vscode.commands.executeCommand("lynxprompt.refreshLocalFiles");
}

function updateLinkMapping(
  linkMappings: Map<string, LinkMapping>,
  localPath: string,
  blueprintId: string,
  checksum: string
): void {
  linkMappings.set(localPath, {
    localPath,
    blueprintId,
    lastChecksum: checksum,
  });
}
