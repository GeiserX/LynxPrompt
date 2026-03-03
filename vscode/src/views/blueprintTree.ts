import * as vscode from "vscode";
import { LynxPromptApi } from "../api";
import { BlueprintListItem, BlueprintType } from "../types";
import { blueprintTypeLabel } from "../utils/fileMapping";

type TreeElement = BlueprintTypeGroup | BlueprintTreeItem;

export class BlueprintTreeProvider
  implements vscode.TreeDataProvider<TreeElement>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeElement | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private blueprints: BlueprintListItem[] = [];

  constructor(private readonly api: LynxPromptApi) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeElement): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeElement): Promise<TreeElement[]> {
    if (!this.api.isAuthenticated) {
      return [];
    }

    if (!element) {
      // Root level: fetch blueprints and group by type
      try {
        const response = await this.api.listBlueprints(200, 0);
        this.blueprints = response.blueprints;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(
          `Failed to load blueprints: ${msg}`
        );
        this.blueprints = [];
      }

      // Group by type
      const groups = new Map<BlueprintType, BlueprintListItem[]>();
      for (const bp of this.blueprints) {
        const existing = groups.get(bp.type) || [];
        existing.push(bp);
        groups.set(bp.type, existing);
      }

      // Sort groups alphabetically by label
      const sortedEntries = [...groups.entries()].sort((a, b) =>
        blueprintTypeLabel(a[0]).localeCompare(blueprintTypeLabel(b[0]))
      );

      return sortedEntries.map(
        ([type, items]) => new BlueprintTypeGroup(type, items.length)
      );
    }

    if (element instanceof BlueprintTypeGroup) {
      // Return blueprints of this type
      const items = this.blueprints.filter(
        (bp) => bp.type === element.blueprintType
      );
      return items.map((bp) => new BlueprintTreeItem(bp));
    }

    return [];
  }
}

class BlueprintTypeGroup extends vscode.TreeItem {
  constructor(
    public readonly blueprintType: BlueprintType,
    count: number
  ) {
    super(
      `${blueprintTypeLabel(blueprintType)} (${count})`,
      vscode.TreeItemCollapsibleState.Expanded
    );
    this.iconPath = new vscode.ThemeIcon("folder");
    this.contextValue = "blueprintTypeGroup";
  }
}

export class BlueprintTreeItem extends vscode.TreeItem {
  constructor(public readonly blueprint: BlueprintListItem) {
    super(blueprint.name, vscode.TreeItemCollapsibleState.None);

    this.description = blueprint.visibility.toLowerCase();
    this.tooltip = buildTooltip(blueprint);
    this.contextValue = "blueprint";
    this.iconPath = getVisibilityIcon(blueprint.visibility);

    // Clicking a blueprint shows its details in a quick pick / opens pull command
    this.command = {
      command: "lynxprompt.pullBlueprint",
      title: "Pull Blueprint",
      arguments: [this],
    };
  }
}

function buildTooltip(bp: BlueprintListItem): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**${bp.name}**\n\n`);
  if (bp.description) {
    md.appendMarkdown(`${bp.description}\n\n`);
  }
  md.appendMarkdown(`- **Type:** ${blueprintTypeLabel(bp.type)}\n`);
  md.appendMarkdown(`- **Tier:** ${bp.tier}\n`);
  md.appendMarkdown(`- **Visibility:** ${bp.visibility}\n`);
  if (bp.tags.length > 0) {
    md.appendMarkdown(`- **Tags:** ${bp.tags.join(", ")}\n`);
  }
  md.appendMarkdown(
    `- **Downloads:** ${bp.downloads} | **Favorites:** ${bp.favorites}\n`
  );
  return md;
}

function getVisibilityIcon(
  visibility: string
): vscode.ThemeIcon {
  switch (visibility) {
    case "PUBLIC":
      return new vscode.ThemeIcon("globe");
    case "TEAM":
      return new vscode.ThemeIcon("organization");
    case "PRIVATE":
    default:
      return new vscode.ThemeIcon("lock");
  }
}
