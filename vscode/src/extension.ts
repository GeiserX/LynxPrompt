import * as vscode from "vscode";
import { LynxPromptApi } from "./api";
import { LinkMapping } from "./types";
import { BlueprintTreeProvider } from "./views/blueprintTree";
import { LocalFilesTreeProvider } from "./views/localFilesTree";
import { signIn } from "./commands/signIn";
import { signOut } from "./commands/signOut";
import { pullBlueprint } from "./commands/pull";
import { pushConfig } from "./commands/push";
import { diffBlueprint } from "./commands/diff";
import { generateConfig, convertFormat } from "./commands/generate";

/** Persistent link mappings stored in workspace state. */
const LINK_MAPPINGS_KEY = "lynxprompt.linkMappings";

let statusBarItem: vscode.StatusBarItem | undefined;
let fileWatcher: vscode.FileSystemWatcher | undefined;

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  // Initialize API client
  const api = new LynxPromptApi(context.secrets);

  // Load persisted link mappings from workspace state
  const linkMappings = loadLinkMappings(context);

  // Try to restore authentication state
  const token = await api.loadToken();
  await vscode.commands.executeCommand(
    "setContext",
    "lynxprompt.authenticated",
    !!token
  );

  // Create tree data providers
  const blueprintTree = new BlueprintTreeProvider(api);
  const localFilesTree = new LocalFilesTreeProvider(linkMappings);

  // Register tree views
  const blueprintView = vscode.window.createTreeView("lynxprompt.blueprints", {
    treeDataProvider: blueprintTree,
    showCollapseAll: true,
  });

  const localFilesView = vscode.window.createTreeView(
    "lynxprompt.localFiles",
    {
      treeDataProvider: localFilesTree,
    }
  );

  context.subscriptions.push(blueprintView, localFilesView);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("lynxprompt.signIn", () => signIn(api)),
    vscode.commands.registerCommand("lynxprompt.signOut", () => signOut(api)),
    vscode.commands.registerCommand("lynxprompt.refreshBlueprints", () => {
      blueprintTree.refresh();
    }),
    vscode.commands.registerCommand("lynxprompt.refreshLocalFiles", () => {
      localFilesTree.refresh();
    }),
    vscode.commands.registerCommand("lynxprompt.pullBlueprint", (item) =>
      pullBlueprint(api, linkMappings, item).then(() =>
        saveLinkMappings(context, linkMappings)
      )
    ),
    vscode.commands.registerCommand("lynxprompt.pushConfig", (item) =>
      pushConfig(api, linkMappings, item).then(() =>
        saveLinkMappings(context, linkMappings)
      )
    ),
    vscode.commands.registerCommand("lynxprompt.diffBlueprint", (item) =>
      diffBlueprint(api, linkMappings, item)
    ),
    vscode.commands.registerCommand("lynxprompt.generateConfig", () =>
      generateConfig()
    ),
    vscode.commands.registerCommand("lynxprompt.convertFormat", () =>
      convertFormat()
    ),
    vscode.commands.registerCommand("lynxprompt.openBlueprint", (item) => {
      if (item && item.blueprint) {
        const config = vscode.workspace.getConfiguration("lynxprompt");
        const baseUrl = config
          .get<string>("apiUrl", "https://lynxprompt.com")
          ?.replace(/\/+$/, "");
        const url = `${baseUrl}/blueprints/${item.blueprint.id}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
      }
    })
  );

  // Status bar
  createStatusBar(context, api);

  // File watchers
  setupFileWatchers(context, linkMappings, localFilesTree);

  // Persist link mappings when extension deactivates
  context.subscriptions.push(
    new vscode.Disposable(() => {
      saveLinkMappings(context, linkMappings);
    })
  );
}

export function deactivate(): void {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

function createStatusBar(
  context: vscode.ExtensionContext,
  api: LynxPromptApi
): void {
  const config = vscode.workspace.getConfiguration("lynxprompt");
  if (!config.get<boolean>("showStatusBar", true)) {
    return;
  }

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    50
  );

  updateStatusBar(api);
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Update status bar when auth state changes
  context.subscriptions.push(
    context.secrets.onDidChange((e) => {
      if (e.key === "lynxprompt.token") {
        // Reload token state and update
        api.loadToken().then(() => updateStatusBar(api));
      }
    })
  );
}

function updateStatusBar(api: LynxPromptApi): void {
  if (!statusBarItem) {
    return;
  }

  if (api.isAuthenticated) {
    statusBarItem.text = "$(check) LynxPrompt";
    statusBarItem.tooltip = "LynxPrompt: Connected. Click to manage.";
    statusBarItem.command = "lynxprompt.refreshBlueprints";
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = "$(circle-slash) LynxPrompt";
    statusBarItem.tooltip = "LynxPrompt: Not signed in. Click to sign in.";
    statusBarItem.command = "lynxprompt.signIn";
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  }
}

function setupFileWatchers(
  context: vscode.ExtensionContext,
  linkMappings: Map<string, LinkMapping>,
  localFilesTree: LocalFilesTreeProvider
): void {
  const config = vscode.workspace.getConfiguration("lynxprompt");
  if (!config.get<boolean>("watchFileChanges", true)) {
    return;
  }

  // Watch common AI config file patterns
  const patterns = [
    "**/AGENTS.md",
    "**/CLAUDE.md",
    "**/.cursor/rules/**",
    "**/.github/copilot-instructions.md",
    "**/copilot-instructions.md",
    "**/.windsurfrules",
    "**/.clinerules",
    "**/CODEX.md",
  ];

  for (const pattern of patterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidChange((uri) => {
      handleFileChange(uri, linkMappings, localFilesTree);
    });

    watcher.onDidCreate((_uri) => {
      localFilesTree.refresh();
    });

    watcher.onDidDelete((uri) => {
      linkMappings.delete(uri.fsPath);
      saveLinkMappings(context, linkMappings);
      localFilesTree.refresh();
    });

    context.subscriptions.push(watcher);
  }
}

async function handleFileChange(
  uri: vscode.Uri,
  linkMappings: Map<string, LinkMapping>,
  localFilesTree: LocalFilesTreeProvider
): Promise<void> {
  const mapping = linkMappings.get(uri.fsPath);
  if (!mapping) {
    // Not linked -- just refresh
    localFilesTree.refresh();
    return;
  }

  // Check if content has diverged from last known checksum
  const { computeFileChecksum } = await import("./utils/configDetector");
  const currentChecksum = await computeFileChecksum(uri);

  if (currentChecksum !== mapping.lastChecksum) {
    const relPath = vscode.workspace.asRelativePath(uri);
    const action = await vscode.window.showWarningMessage(
      `${relPath} has been modified and differs from the cloud blueprint.`,
      "Push Changes",
      "Show Diff",
      "Dismiss"
    );

    if (action === "Push Changes") {
      await vscode.commands.executeCommand("lynxprompt.pushConfig", uri);
    } else if (action === "Show Diff") {
      // Find the tree item for this file and diff
      await vscode.commands.executeCommand("lynxprompt.diffBlueprint");
    }

    localFilesTree.refresh();
  }
}

function loadLinkMappings(
  context: vscode.ExtensionContext
): Map<string, LinkMapping> {
  const stored = context.workspaceState.get<Record<string, LinkMapping>>(
    LINK_MAPPINGS_KEY,
    {}
  );
  return new Map(Object.entries(stored));
}

function saveLinkMappings(
  context: vscode.ExtensionContext,
  mappings: Map<string, LinkMapping>
): void {
  const obj: Record<string, LinkMapping> = {};
  for (const [key, value] of mappings) {
    obj[key] = value;
  }
  context.workspaceState.update(LINK_MAPPINGS_KEY, obj);
}
