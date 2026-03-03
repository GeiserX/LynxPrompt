import * as core from '@actions/core';
import { createHash } from 'crypto';
import { LynxPromptClient, ApiBlueprintListItem } from './api';
import { detectConfigFiles, DetectedFile } from './detector';
import { typeLabel, typeTool } from './mapper';

type SyncAction = 'created' | 'updated' | 'unchanged' | 'failed';

interface SyncResult {
  file: string;
  blueprintName: string;
  type: string;
  action: SyncAction;
  id?: string;
  error?: string;
}

/**
 * Compute SHA-256 checksum matching the server's algorithm:
 * first 16 hex characters of SHA-256 digest.
 */
function computeChecksum(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex').slice(0, 16);
}

async function run(): Promise<void> {
  try {
    // --- Read inputs ---
    const token = core.getInput('token', { required: true });
    const apiUrl = core.getInput('api-url') || 'https://lynxprompt.com';
    const visibility = core.getInput('visibility') || 'PRIVATE';
    const extraFiles = core.getInput('files') || '';
    const dryRun = core.getBooleanInput('dry-run');

    // Validate token format
    if (!token.startsWith('lp_')) {
      core.warning(
        'Token does not start with "lp_". Ensure you are using a valid LynxPrompt API token.',
      );
    }

    // Mask token in logs
    core.setSecret(token);

    // Validate visibility
    const validVisibilities = ['PRIVATE', 'TEAM', 'PUBLIC'];
    if (!validVisibilities.includes(visibility.toUpperCase())) {
      throw new Error(
        `Invalid visibility "${visibility}". Must be one of: ${validVisibilities.join(', ')}`,
      );
    }

    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    core.info(`Workspace: ${workspace}`);
    core.info(`API URL: ${apiUrl}`);
    core.info(`Visibility: ${visibility}`);
    if (dryRun) {
      core.info('DRY RUN — no changes will be made');
    }

    // --- Detect files ---
    core.startGroup('Scanning for AI configuration files');
    const files = await detectConfigFiles(workspace, extraFiles || undefined);
    core.endGroup();

    if (files.length === 0) {
      core.warning('No AI configuration files found in this repository.');
      setOutputs(0, 0, 0, 0);
      writeSummary([], dryRun);
      return;
    }

    core.info(`Found ${files.length} config file(s)`);
    for (const f of files) {
      core.info(`  ${f.relativePath} (${typeLabel(f.type)}, ${f.sizeBytes}B)`);
    }

    // --- Dry run: just list and exit ---
    if (dryRun) {
      const results: SyncResult[] = files.map((f) => ({
        file: f.relativePath,
        blueprintName: f.blueprintName,
        type: f.type,
        action: 'unchanged' as SyncAction,
      }));
      setOutputs(0, 0, 0, files.length);
      writeSummary(results, true);
      return;
    }

    // --- Authenticate ---
    const client = new LynxPromptClient(apiUrl, token);
    core.startGroup('Authenticating with LynxPrompt');
    await client.validateToken();
    core.info('Token validated successfully');
    core.endGroup();

    // --- Fetch existing blueprints ---
    core.startGroup('Fetching existing blueprints');
    const existing = await client.listBlueprints();
    core.endGroup();

    // --- Sync each file ---
    core.startGroup('Syncing files');
    const results: SyncResult[] = [];

    for (const file of files) {
      const result = await syncFile(client, file, existing, visibility);
      results.push(result);

      // If we created a new blueprint, add it to the existing list
      // so subsequent files with the same name+type don't create duplicates
      if (result.action === 'created' && result.id) {
        existing.push({
          id: result.id,
          name: file.blueprintName,
          type: file.type,
          visibility: visibility.toUpperCase(),
          content_checksum: computeChecksum(file.content),
        });
      }
    }
    core.endGroup();

    // --- Report ---
    const created = results.filter((r) => r.action === 'created').length;
    const updated = results.filter((r) => r.action === 'updated').length;
    const unchanged = results.filter((r) => r.action === 'unchanged').length;
    const failed = results.filter((r) => r.action === 'failed').length;

    core.info('');
    core.info('=== Sync Summary ===');
    core.info(`  Created:   ${created}`);
    core.info(`  Updated:   ${updated}`);
    core.info(`  Unchanged: ${unchanged}`);
    if (failed > 0) {
      core.warning(`  Failed:    ${failed}`);
    }

    setOutputs(created + updated, created, updated, unchanged);
    writeSummary(results, false);

    if (failed > 0) {
      core.warning(`${failed} file(s) failed to sync. Check the logs above for details.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}

/**
 * Sync a single file: create or update the matching blueprint.
 * Never throws — returns a failed result instead.
 */
async function syncFile(
  client: LynxPromptClient,
  file: DetectedFile,
  existing: ApiBlueprintListItem[],
  visibility: string,
): Promise<SyncResult> {
  const base = {
    file: file.relativePath,
    blueprintName: file.blueprintName,
    type: file.type,
  };

  try {
    // Find an existing blueprint with the same name + type
    const match = existing.find(
      (b) => b.name === file.blueprintName && b.type === file.type,
    );

    const localChecksum = computeChecksum(file.content);

    if (match) {
      // Check if content is the same
      if (match.content_checksum && localChecksum === match.content_checksum) {
        core.info(`  [unchanged] ${file.relativePath}`);
        return { ...base, action: 'unchanged', id: match.id };
      }

      // Update existing
      try {
        const updated = await client.updateBlueprint(match.id, {
          content: file.content,
        });
        core.info(`  [updated]   ${file.relativePath} -> ${updated.id}`);
        return { ...base, action: 'updated', id: updated.id };
      } catch (updateErr) {
        // If update fails with 404, the blueprint was deleted — recreate it
        const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
        if (msg.includes('404')) {
          core.warning(`Blueprint ${match.id} not found, recreating...`);
          const created = await client.createBlueprint({
            name: file.blueprintName,
            content: file.content,
            type: file.type,
            visibility: visibility.toUpperCase(),
            tags: ['github-action'],
          });
          core.info(`  [created]   ${file.relativePath} -> ${created.id} (recreated)`);
          return { ...base, action: 'created', id: created.id };
        }
        // If update fails with 409 (conflict/checksum mismatch), force update
        if (msg.includes('409')) {
          core.warning(`Checksum conflict for ${file.relativePath}, forcing update...`);
          const updated = await client.updateBlueprint(match.id, {
            content: file.content,
          });
          core.info(`  [updated]   ${file.relativePath} -> ${updated.id} (forced)`);
          return { ...base, action: 'updated', id: updated.id };
        }
        throw updateErr;
      }
    }

    // Create new
    const created = await client.createBlueprint({
      name: file.blueprintName,
      content: file.content,
      type: file.type,
      visibility: visibility.toUpperCase(),
      tags: ['github-action'],
    });
    core.info(`  [created]   ${file.relativePath} -> ${created.id}`);
    return { ...base, action: 'created', id: created.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    core.error(`  [FAILED]    ${file.relativePath}: ${msg}`);
    return { ...base, action: 'failed', error: msg };
  }
}

function setOutputs(
  synced: number,
  created: number,
  updated: number,
  unchanged: number,
): void {
  core.setOutput('synced', synced);
  core.setOutput('created', created);
  core.setOutput('updated', updated);
  core.setOutput('unchanged', unchanged);
}

function writeSummary(results: SyncResult[], dryRun: boolean): void {
  if (results.length === 0) {
    core.summary.addRaw('No AI configuration files found in this repository.');
    core.summary.write();
    return;
  }

  const title = dryRun
    ? 'LynxPrompt Sync — Dry Run'
    : 'LynxPrompt Sync Results';

  core.summary.addHeading(title, 2);

  const statusIcon = (action: SyncAction): string => {
    if (dryRun) return '\u{1F4CB}'; // clipboard
    switch (action) {
      case 'created':   return '\u{2795}'; // plus
      case 'updated':   return '\u{1F504}'; // arrows
      case 'unchanged': return '\u{2705}'; // check
      case 'failed':    return '\u{274C}'; // X
    }
  };

  const rows: (string | { data: string; header: boolean })[][] = [
    [
      { data: 'File', header: true },
      { data: 'Type', header: true },
      { data: 'Tool', header: true },
      { data: 'Status', header: true },
    ],
  ];

  for (const r of results) {
    const icon = statusIcon(r.action);
    const status = dryRun ? 'would sync' : r.action;
    rows.push([
      `\`${r.file}\``,
      typeLabel(r.type),
      typeTool(r.type),
      `${icon} ${status}`,
    ]);
  }

  core.summary.addTable(rows);

  const created = results.filter((r) => r.action === 'created').length;
  const updated = results.filter((r) => r.action === 'updated').length;
  const unchanged = results.filter((r) => r.action === 'unchanged').length;
  const failed = results.filter((r) => r.action === 'failed').length;

  if (!dryRun) {
    let summary = `**${created}** created, **${updated}** updated, **${unchanged}** unchanged`;
    if (failed > 0) summary += `, **${failed}** failed`;
    core.summary.addRaw(`\n${summary}`);
  } else {
    core.summary.addRaw(`\n**${results.length}** file(s) would be synced`);
  }

  core.summary.write();
}

run();
