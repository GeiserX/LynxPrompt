import * as vscode from "vscode";
import * as path from "path";
import { LynxPromptApi } from "../api";
import { BlueprintTreeItem } from "../views/blueprintTree";
import { LocalFileTreeItem } from "../views/localFilesTree";
import { LinkMapping } from "../types";
import { blueprintTypeToPath } from "../utils/fileMapping";

export async function diffBlueprint(
  api: LynxPromptApi,
  linkMappings: Map<string, LinkMapping>,
  item?: BlueprintTreeItem | LocalFileTreeItem
): Promise<void> {
  if (!api.isAuthenticated) {
    vscode.window.showErrorMessage("Please sign in to LynxPrompt first.");
    return;
  }

  let blueprintId: string | undefined;
  let localFilePath: string | undefined;

  if (item instanceof BlueprintTreeItem) {
    blueprintId = item.blueprint.id;
  } else if (item instanceof LocalFileTreeItem) {
    localFilePath = item.configFile.absolutePath;
    blueprintId = item.configFile.linkedBlueprintId;
  }

  if (!blueprintId) {
    // Try to pick a blueprint
    const response = await api.listBlueprints(200);
    if (response.blueprints.length === 0) {
      vscode.window.showInformationMessage("No blueprints available to compare.");
      return;
    }

    const picked = await vscode.window.showQuickPick(
      response.blueprints.map((bp) => ({
        label: bp.name,
        description: `${bp.type} - ${bp.visibility.toLowerCase()}`,
        blueprintId: bp.id,
        type: bp.type,
      })),
      { placeHolder: "Select a blueprint to compare" }
    );

    if (!picked) {
      return;
    }
    blueprintId = picked.blueprintId;
  }

  // Fetch blueprint
  const blueprint = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Fetching blueprint for comparison...",
    },
    async () => api.getBlueprint(blueprintId!)
  );

  // Find local file
  if (!localFilePath) {
    // Search for the matching local file based on blueprint type
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    // Check link mappings first
    for (const [localPath, mapping] of linkMappings) {
      if (mapping.blueprintId === blueprintId) {
        localFilePath = localPath;
        break;
      }
    }

    // Fallback: try the default path
    if (!localFilePath) {
      const relativePath = blueprintTypeToPath(blueprint.type, blueprint.name);
      for (const folder of workspaceFolders) {
        const candidatePath = path.join(folder.uri.fsPath, relativePath);
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(candidatePath));
          localFilePath = candidatePath;
          break;
        } catch {
          // File doesn't exist in this folder
        }
      }
    }
  }

  // Create a virtual document for the cloud content
  const cloudContent = Buffer.from(blueprint.content, "utf-8");

  // Use a temporary file for the cloud version
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const ext = localFilePath ? path.extname(localFilePath) : ".md";
  const tempDir = path.join(workspaceFolder.uri.fsPath, ".lynxprompt-tmp");
  const tempPath = path.join(tempDir, `${blueprint.id}-cloud${ext}`);
  const tempUri = vscode.Uri.file(tempPath);

  await vscode.workspace.fs.createDirectory(vscode.Uri.file(tempDir));
  await vscode.workspace.fs.writeFile(tempUri, cloudContent);

  if (localFilePath) {
    const localUri = vscode.Uri.file(localFilePath);
    const localRelative = vscode.workspace.asRelativePath(localUri);

    await vscode.commands.executeCommand(
      "vscode.diff",
      localUri,
      tempUri,
      `${localRelative} (Local) <-> ${blueprint.name} (Cloud)`
    );
  } else {
    // No local file -- just open the cloud content
    const doc = await vscode.workspace.openTextDocument(tempUri);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(
      `No local file found for "${blueprint.name}". Showing cloud version.`
    );
  }

  // Schedule cleanup of temp files after a delay
  setTimeout(async () => {
    try {
      await vscode.workspace.fs.delete(tempUri);
      await vscode.workspace.fs.delete(vscode.Uri.file(tempDir), {
        recursive: true,
      });
    } catch {
      // Ignore cleanup errors
    }
  }, 60_000);
}
