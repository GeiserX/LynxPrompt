/**
 * Agents command - manage which AI agents to sync to
 * 
 * Simple, intuitive agent management:
 *   lynxp agents              - List all agents and their status
 *   lynxp agents enable X     - Enable an agent
 *   lynxp agents disable X    - Disable an agent
 *   lynxp agents detect       - Auto-detect agents in project
 */

import chalk from "chalk";
import prompts from "prompts";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import * as yaml from "yaml";
import { 
  AGENTS, 
  getAgent, 
  getPopularAgents, 
  getAgentsByCategory,
  type AgentDefinition 
} from "../utils/agents.js";
import { detectAgents, formatDetectionResults } from "../utils/agent-detector.js";

interface AgentsOptions {
  interactive?: boolean;
}

// Config paths
const CONFIG_FILE = ".lynxprompt/conf.yml";

interface LynxPromptConfig {
  version: string;
  exporters: string[];
  sources: Array<{
    type: string;
    path: string;
  }>;
}

export async function agentsCommand(
  action?: string,
  agentId?: string,
  options: AgentsOptions = {}
): Promise<void> {
  console.log();

  switch (action) {
    case "enable":
      await enableAgent(agentId, options);
      break;
    case "disable":
      await disableAgent(agentId);
      break;
    case "detect":
      await detectAgentsInProject();
      break;
    case "list":
    default:
      await listAgents();
      break;
  }
}

/**
 * List all agents with their status
 */
async function listAgents(): Promise<void> {
  console.log(chalk.cyan("🐱 LynxPrompt Agents"));
  console.log();

  const config = await loadConfig();
  const enabledSet = new Set(config?.exporters ?? []);
  const detection = detectAgents();

  // Show enabled agents first
  if (enabledSet.size > 0) {
    console.log(chalk.green("Enabled:"));
    for (const id of enabledSet) {
      const agent = getAgent(id);
      const detected = detection.detected.find((d) => d.agent.id === id);
      const status = detected ? chalk.gray("(detected)") : "";
      console.log(`  ${chalk.green("✓")} ${agent?.name ?? id} ${status}`);
    }
    console.log();
  }

  // Show detected but not enabled
  const detectedNotEnabled = detection.detected.filter(
    (d) => !enabledSet.has(d.agent.id)
  );
  if (detectedNotEnabled.length > 0) {
    console.log(chalk.yellow("Detected (not enabled):"));
    for (const detected of detectedNotEnabled) {
      const rules = detected.ruleCount > 0 ? chalk.gray(` (${detected.ruleCount} rules)`) : "";
      console.log(`  ${chalk.yellow("○")} ${detected.agent.name}${rules}`);
    }
    console.log();
  }

  // Show popular available
  const popular = getPopularAgents().filter(
    (a) => !enabledSet.has(a.id) && !detectedNotEnabled.some((d) => d.agent.id === a.id)
  );
  if (popular.length > 0) {
    console.log(chalk.gray("Popular (available):"));
    for (const agent of popular) {
      console.log(`  ${chalk.gray("-")} ${agent.name} - ${agent.description}`);
    }
    console.log();
  }

  // Summary and help
  console.log(chalk.gray(`Total: ${AGENTS.length} agents supported`));
  console.log();
  console.log(chalk.gray("Commands:"));
  console.log(chalk.gray("  lynxp agents enable <agent>   Enable an agent"));
  console.log(chalk.gray("  lynxp agents disable <agent>  Disable an agent"));
  console.log(chalk.gray("  lynxp agents detect           Auto-detect agents"));
  console.log();
}

/**
 * Enable an agent
 */
async function enableAgent(agentId?: string, options: AgentsOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    console.log(chalk.yellow("LynxPrompt not initialized. Run 'lynxp init' first."));
    return;
  }

  let config = await loadConfig();
  if (!config) {
    console.log(chalk.red("Could not load configuration."));
    return;
  }

  // Interactive mode - select from all agents
  if (!agentId || options.interactive) {
    const enabledSet = new Set(config.exporters ?? []);
    
    const choices = AGENTS.map((agent) => ({
      title: `${agent.name} - ${agent.description}`,
      value: agent.id,
      selected: enabledSet.has(agent.id),
    }));

    const { selected } = await prompts({
      type: "multiselect",
      name: "selected",
      message: "Select agents to enable:",
      choices,
      hint: "- Space to select, Enter to confirm",
    });

    if (!selected || selected.length === 0) {
      console.log(chalk.yellow("No agents selected."));
      return;
    }

    config.exporters = selected;
    await saveConfig(config);
    
    console.log(chalk.green(`✓ Enabled ${selected.length} agent${selected.length === 1 ? "" : "s"}`));
    console.log();
    console.log(chalk.gray("Run 'lynxp sync' to sync your rules."));
    return;
  }

  // Enable specific agent
  const agent = getAgent(agentId);
  if (!agent) {
    // Fuzzy search for similar names
    const similar = AGENTS.filter((a) => 
      a.id.includes(agentId.toLowerCase()) || 
      a.name.toLowerCase().includes(agentId.toLowerCase())
    );
    
    console.log(chalk.red(`Unknown agent: ${agentId}`));
    if (similar.length > 0) {
      console.log();
      console.log(chalk.gray("Did you mean:"));
      for (const a of similar.slice(0, 5)) {
        console.log(chalk.gray(`  ${a.id} - ${a.name}`));
      }
    }
    return;
  }

  if (!config.exporters) {
    config.exporters = [];
  }

  if (config.exporters.includes(agent.id)) {
    console.log(chalk.yellow(`${agent.name} is already enabled.`));
    return;
  }

  config.exporters.push(agent.id);
  await saveConfig(config);

  console.log(chalk.green(`✓ Enabled ${agent.name}`));
  console.log();
  console.log(chalk.gray(`Output: ${agent.output}`));
  console.log(chalk.gray("Run 'lynxp sync' to sync your rules."));
}

/**
 * Disable an agent
 */
async function disableAgent(agentId?: string): Promise<void> {
  if (!agentId) {
    console.log(chalk.yellow("Usage: lynxp agents disable <agent>"));
    return;
  }

  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    console.log(chalk.yellow("LynxPrompt not initialized. Run 'lynxp init' first."));
    return;
  }

  const config = await loadConfig();
  if (!config) {
    console.log(chalk.red("Could not load configuration."));
    return;
  }

  if (!config.exporters || !config.exporters.includes(agentId)) {
    const agent = getAgent(agentId);
    console.log(chalk.yellow(`${agent?.name ?? agentId} is not enabled.`));
    return;
  }

  // Prevent disabling last agent
  if (config.exporters.length === 1) {
    console.log(chalk.yellow("Cannot disable the last agent. At least one must be enabled."));
    return;
  }

  config.exporters = config.exporters.filter((e) => e !== agentId);
  await saveConfig(config);

  const agent = getAgent(agentId);
  console.log(chalk.green(`✓ Disabled ${agent?.name ?? agentId}`));
}

/**
 * Auto-detect agents in project
 */
async function detectAgentsInProject(): Promise<void> {
  console.log(chalk.cyan("🔍 Detecting AI agents..."));
  console.log();

  const detection = detectAgents();
  console.log(formatDetectionResults(detection));
  console.log();

  if (detection.detected.length === 0) {
    return;
  }

  // Offer to enable detected agents
  const config = await loadConfig();
  const enabledSet = new Set(config?.exporters ?? []);
  const newAgents = detection.detected.filter((d) => !enabledSet.has(d.agent.id));

  if (newAgents.length === 0) {
    console.log(chalk.gray("All detected agents are already enabled."));
    return;
  }

  const { enable } = await prompts({
    type: "confirm",
    name: "enable",
    message: `Enable ${newAgents.length} detected agent${newAgents.length === 1 ? "" : "s"}?`,
    initial: true,
  });

  if (enable && config) {
    config.exporters = [
      ...(config.exporters ?? []),
      ...newAgents.map((d) => d.agent.id),
    ];
    await saveConfig(config);
    console.log(chalk.green(`✓ Enabled ${newAgents.length} agent${newAgents.length === 1 ? "" : "s"}`));
  }
}

/**
 * Load config file
 */
async function loadConfig(): Promise<LynxPromptConfig | null> {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = await readFile(configPath, "utf-8");
    return yaml.parse(content) as LynxPromptConfig;
  } catch {
    return null;
  }
}

/**
 * Save config file
 */
async function saveConfig(config: LynxPromptConfig): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILE);
  
  const content = yaml.stringify(config);
  await writeFile(configPath, content, "utf-8");
}

