import * as vscode from "vscode";
import { LocalConfigFile, LinkMapping } from "../types";
import { detectConfigFiles } from "../utils/configDetector";
import { blueprintTypeLabel } from "../utils/fileMapping";

export class LocalFilesTreeProvider
  implements vscode.TreeDataProvider<LocalFileTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    LocalFileTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _linkMappings: Map<string, LinkMapping>;

  constructor(linkMappings: Map<string, LinkMapping>) {
    this._linkMappings = linkMappings;
  }

  get linkMappings(): Map<string, LinkMapping> {
    return this._linkMappings;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LocalFileTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    _element?: LocalFileTreeItem
  ): Promise<LocalFileTreeItem[]> {
    // Flat list -- no nesting
    const config = vscode.workspace.getConfiguration("lynxprompt");
    if (!config.get<boolean>("autoDetectConfigFiles", true)) {
      return [];
    }

    const files = await detectConfigFiles(this._linkMappings);
    return files.map((f) => new LocalFileTreeItem(f));
  }
}

export class LocalFileTreeItem extends vscode.TreeItem {
  constructor(public readonly configFile: LocalConfigFile) {
    super(configFile.relativePath, vscode.TreeItemCollapsibleState.None);

    this.description = `${blueprintTypeLabel(configFile.type)} - ${configFile.status}`;
    this.tooltip = buildTooltip(configFile);
    this.resourceUri = vscode.Uri.file(configFile.absolutePath);

    // Context value determines available context menu items
    this.contextValue = configFile.linkedBlueprintId
      ? "localConfigLinked"
      : "localConfig";

    this.iconPath = getStatusIcon(configFile.status);

    // Click to open the file
    this.command = {
      command: "vscode.open",
      title: "Open File",
      arguments: [vscode.Uri.file(configFile.absolutePath)],
    };
  }
}

function buildTooltip(file: LocalConfigFile): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**${file.relativePath}**\n\n`);
  md.appendMarkdown(`- **Type:** ${blueprintTypeLabel(file.type)}\n`);
  md.appendMarkdown(`- **Status:** ${file.status}\n`);
  if (file.linkedBlueprintId) {
    md.appendMarkdown(`- **Linked to:** ${file.linkedBlueprintId}\n`);
  }
  md.appendMarkdown(`- **Path:** ${file.absolutePath}\n`);
  return md;
}

function getStatusIcon(status: LocalConfigFile["status"]): vscode.ThemeIcon {
  switch (status) {
    case "synced":
      return new vscode.ThemeIcon(
        "check",
        new vscode.ThemeColor("charts.green")
      );
    case "modified":
      return new vscode.ThemeIcon(
        "warning",
        new vscode.ThemeColor("charts.yellow")
      );
    case "untracked":
    default:
      return new vscode.ThemeIcon("circle-outline");
  }
}
