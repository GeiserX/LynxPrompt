import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import prompts from "prompts";
import { api, ApiRequestError } from "../api.js";
import { isAuthenticated } from "../config.js";
import {
  findBlueprintByFile,
  trackBlueprint,
  updateChecksum,
} from "../utils/blueprint-tracker.js";

interface PushOptions {
  name?: string;
  description?: string;
  visibility?: string;
  tags?: string;
  yes?: boolean;
}

export async function pushCommand(
  fileArg: string | undefined,
  options: PushOptions
): Promise<void> {
  const cwd = process.cwd();

  // Check authentication
  if (!isAuthenticated()) {
    console.log(chalk.yellow("You need to be logged in to push blueprints."));
    console.log(chalk.gray("Run 'lynxp login' to authenticate."));
    process.exit(1);
  }

  // Find the file to push
  const file = fileArg || findDefaultFile();
  if (!file) {
    console.log(chalk.red("No AI configuration file found."));
    console.log(
      chalk.gray("Specify a file or run in a directory with AGENTS.md, CLAUDE.md, etc.")
    );
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.log(chalk.red(`File not found: ${file}`));
    process.exit(1);
  }

  const content = fs.readFileSync(file, "utf-8");
  const filename = path.basename(file);

  // Check if file is already linked to a blueprint
  const linked = await findBlueprintByFile(cwd, file);

  if (linked) {
    // Update existing blueprint
    await updateBlueprint(cwd, file, linked.id, content, options);
  } else {
    // Create new blueprint or link to existing
    await createOrLinkBlueprint(cwd, file, filename, content, options);
  }
}

async function updateBlueprint(
  cwd: string,
  file: string,
  blueprintId: string,
  content: string,
  options: PushOptions
): Promise<void> {
  console.log(chalk.cyan(`\n📤 Updating blueprint ${chalk.bold(blueprintId)}...`));
  console.log(chalk.gray(`   File: ${file}`));

  if (!options.yes) {
    const confirm = await prompts({
      type: "confirm",
      name: "value",
      message: `Push changes to ${blueprintId}?`,
      initial: true,
    });

    if (!confirm.value) {
      console.log(chalk.yellow("Push cancelled."));
      return;
    }
  }

  const spinner = ora("Pushing changes...").start();

  try {
    const result = await api.updateBlueprint(blueprintId, { content });
    spinner.succeed("Blueprint updated!");

    // Update local tracking
    await updateChecksum(cwd, file, content);

    console.log();
    console.log(chalk.green(`✅ Successfully updated ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${blueprintId}`));
    console.log(chalk.gray(`   View: https://lynxprompt.com/templates/${blueprintId.replace("bp_", "")}`));
  } catch (error) {
    spinner.fail("Failed to update blueprint");
    handleError(error);
  }
}

async function createOrLinkBlueprint(
  cwd: string,
  file: string,
  filename: string,
  content: string,
  options: PushOptions
): Promise<void> {
  console.log(chalk.cyan("\n📤 Push new blueprint"));
  console.log(chalk.gray(`   File: ${file}`));

  // Ask for details if not provided
  let name = options.name;
  let description = options.description;
  let visibility = options.visibility || "PRIVATE";
  let tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : [];

  if (!options.yes) {
    const responses = await prompts([
      {
        type: name ? null : "text",
        name: "name",
        message: "Blueprint name:",
        initial: filename.replace(/\.(md|mdc|json|yml|yaml)$/, ""),
        validate: (v) => v.length > 0 || "Name is required",
      },
      {
        type: description ? null : "text",
        name: "description",
        message: "Description:",
        initial: "",
      },
      {
        type: "select",
        name: "visibility",
        message: "Visibility:",
        choices: [
          { title: "Private (only you)", value: "PRIVATE" },
          { title: "Team (your team members)", value: "TEAM" },
          { title: "Public (visible to everyone)", value: "PUBLIC" },
        ],
        initial: 0,
      },
      {
        type: "text",
        name: "tags",
        message: "Tags (comma-separated):",
        initial: "",
      },
    ]);

    if (!responses.name && !name) {
      console.log(chalk.yellow("Push cancelled."));
      return;
    }

    name = name || responses.name;
    description = description || responses.description || "";
    visibility = responses.visibility || visibility;
    tags = responses.tags ? responses.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : tags;
  }

  if (!name) {
    name = filename.replace(/\.(md|mdc|json|yml|yaml)$/, "");
  }

  const spinner = ora("Creating blueprint...").start();

  try {
    const result = await api.createBlueprint({
      name,
      description: description || "",
      content,
      visibility: visibility as "PRIVATE" | "TEAM" | "PUBLIC",
      tags,
    });

    spinner.succeed("Blueprint created!");

    // Track the blueprint locally
    await trackBlueprint(cwd, {
      id: result.blueprint.id,
      name: result.blueprint.name,
      file,
      content,
      source: "private",
    });

    console.log();
    console.log(chalk.green(`✅ Created blueprint ${chalk.bold(result.blueprint.name)}`));
    console.log(chalk.gray(`   ID: ${result.blueprint.id}`));
    console.log(chalk.gray(`   Visibility: ${visibility}`));
    if (visibility === "PUBLIC") {
      console.log(chalk.gray(`   View: https://lynxprompt.com/templates/${result.blueprint.id.replace("bp_", "")}`));
    }
    console.log();
    console.log(chalk.cyan("The file is now linked. Future 'lynxp push' will update this blueprint."));
  } catch (error) {
    spinner.fail("Failed to create blueprint");
    handleError(error);
  }
}

function findDefaultFile(): string | null {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    ".cursor/rules/project.mdc",
    ".github/copilot-instructions.md",
    ".windsurfrules",
    "AIDER.md",
    "GEMINI.md",
    ".clinerules",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function handleError(error: unknown): void {
  if (error instanceof ApiRequestError) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.statusCode === 401) {
      console.error(chalk.gray("Your session may have expired. Run 'lynxp login' to re-authenticate."));
    } else if (error.statusCode === 403) {
      console.error(chalk.gray("You don't have permission to modify this blueprint."));
    } else if (error.statusCode === 404) {
      console.error(chalk.gray("Blueprint not found. It may have been deleted."));
    }
  } else {
    console.error(chalk.red("An unexpected error occurred."));
  }
  process.exit(1);
}
