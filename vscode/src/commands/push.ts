import * as vscode from "vscode";
import * as path from "path";
import { LynxPromptApi } from "../api";
import { LocalFileTreeItem } from "../views/localFilesTree";
import { BlueprintType, LinkMapping } from "../types";
import { pathToBlueprintType, blueprintTypeLabel } from "../utils/fileMapping";

export async function pushConfig(
  api: LynxPromptApi,
  linkMappings: Map<string, LinkMapping>,
  item?: LocalFileTreeItem | vscode.Uri
): Promise<void> {
  if (!api.isAuthenticated) {
    vscode.window.showErrorMessage("Please sign in to LynxPrompt first.");
    return;
  }

  let fileUri: vscode.Uri;

  if (item instanceof LocalFileTreeItem) {
    fileUri = vscode.Uri.file(item.configFile.absolutePath);
  } else if (item instanceof vscode.Uri) {
    fileUri = item;
  } else {
    // Open file picker
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      openLabel: "Select AI config file to push",
      filters: {
        "AI Config Files": ["md", "mdc", "yml", "json"],
      },
    });
    if (!uris || uris.length === 0) {
      return;
    }
    fileUri = uris[0];
  }

  const filePath = fileUri.fsPath;

  // Detect type
  let detectedType = pathToBlueprintType(filePath);
  if (!detectedType) {
    const typeOptions: Array<{ label: string; type: BlueprintType }> = [
      { label: "AGENTS.md", type: "AGENTS_MD" },
      { label: "CLAUDE.md", type: "CLAUDE_MD" },
      { label: "Cursor Rules", type: "CURSOR_RULES" },
      { label: "Copilot Instructions", type: "COPILOT_INSTRUCTIONS" },
      { label: "Windsurf Rules", type: "WINDSURF_RULES" },
      { label: "Cline Rules", type: "CLINE_RULES" },
      { label: "Aider Rules", type: "AIDER_RULES" },
      { label: "Continue Rules", type: "CONTINUE_RULES" },
      { label: "Codex Rules", type: "CODEX_RULES" },
      { label: "Custom", type: "CUSTOM" },
    ];

    const picked = await vscode.window.showQuickPick(
      typeOptions.map((t) => ({ label: t.label, type: t.type })),
      { placeHolder: "Select the blueprint type for this file" }
    );
    if (!picked) {
      return;
    }
    detectedType = picked.type;
  }

  // Read file content
  const fileContent = await vscode.workspace.fs.readFile(fileUri);
  const content = Buffer.from(fileContent).toString("utf-8");

  if (content.trim().length === 0) {
    vscode.window.showWarningMessage("File is empty. Nothing to push.");
    return;
  }

  // Check if already linked to a blueprint
  const linkMapping = linkMappings.get(filePath);
  const basename = path.basename(filePath, path.extname(filePath));

  if (linkMapping) {
    // Update existing blueprint
    const choice = await vscode.window.showQuickPick(
      [
        {
          label: "Update existing blueprint",
          description: linkMapping.blueprintId,
          action: "update" as const,
        },
        {
          label: "Create new blueprint",
          description: "Create a new blueprint from this file",
          action: "create" as const,
        },
      ],
      { placeHolder: "This file is linked to a blueprint" }
    );

    if (!choice) {
      return;
    }

    if (choice.action === "update") {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Updating blueprint...",
        },
        async () => {
          const updated = await api.updateBlueprint(linkMapping.blueprintId, {
            content,
          });
          linkMappings.set(filePath, {
            localPath: filePath,
            blueprintId: updated.id,
            lastChecksum: updated.content_checksum,
          });
        }
      );

      vscode.window.showInformationMessage(
        `Blueprint ${linkMapping.blueprintId} updated.`
      );
      await vscode.commands.executeCommand("lynxprompt.refreshBlueprints");
      await vscode.commands.executeCommand("lynxprompt.refreshLocalFiles");
      return;
    }
  }

  // Create new blueprint
  const name = await vscode.window.showInputBox({
    prompt: "Blueprint name",
    value: basename,
    validateInput: (val) => (val.trim().length === 0 ? "Name is required" : null),
  });

  if (!name) {
    return;
  }

  const description = await vscode.window.showInputBox({
    prompt: "Blueprint description (optional)",
    placeHolder: "A brief description of this configuration",
  });

  const visibility = await vscode.window.showQuickPick(
    [
      { label: "Private", description: "Only you can see this", value: "PRIVATE" as const },
      { label: "Team", description: "Visible to your team", value: "TEAM" as const },
      { label: "Public", description: "Visible to everyone", value: "PUBLIC" as const },
    ],
    { placeHolder: "Visibility" }
  );

  if (!visibility) {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating blueprint...",
    },
    async () => {
      const created = await api.createBlueprint({
        name: name.trim(),
        description: description?.trim() || undefined,
        type: detectedType,
        visibility: visibility.value,
        content,
      });

      // Store link mapping
      linkMappings.set(filePath, {
        localPath: filePath,
        blueprintId: created.id,
        lastChecksum: created.content_checksum,
      });
    }
  );

  vscode.window.showInformationMessage(
    `Blueprint "${name}" created as ${blueprintTypeLabel(detectedType)}.`
  );

  await vscode.commands.executeCommand("lynxprompt.refreshBlueprints");
  await vscode.commands.executeCommand("lynxprompt.refreshLocalFiles");
}
