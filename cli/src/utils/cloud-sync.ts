/**
 * Cloud Sync from `lynxp wizard`: the private blueprint a generated file is
 * saved as. Kept free of the wizard's prompts so it can be unit tested.
 */

import { api } from "../api.js";
import { calculateChecksum } from "./blueprint-tracker.js";
import { matchConfigFile } from "./blueprint-files.js";
import { pickSyncFile } from "./generator.js";

/**
 * Cloud Sync: save the synced file (the one picked, or the first rules file)
 * as a private blueprint of its tool's type, then regenerate the files with
 * the blueprint id, which adds the sync header. The cloud then gets the file
 * as it is written, so it is not reported as changed and the first sync does
 * not upload the header. Returns undefined when there is no file to sync.
 */
export async function saveSyncedBlueprint(
  files: Record<string, string>,
  meta: { name?: string; description?: string; primarySyncFormat?: string },
  regenerate: (blueprintId: string) => Record<string, string>
): Promise<{ blueprintId: string; files: Record<string, string>; syncedFile: { file: string; uploadedContent: string } } | undefined> {
  const mainFile = pickSyncFile(files, meta.primarySyncFormat);
  if (!mainFile) return undefined;
  const [fileName, content] = mainFile;
  const syncedFile = { file: fileName, uploadedContent: content };
  const response = await api.createBlueprint({
    name: meta.name || "My AI Config",
    description: meta.description || "Generated with LynxPrompt CLI",
    content,
    visibility: "PRIVATE",
    // The tool the file is for, as the web wizard sends it (else the server says AGENTS_MD)
    type: matchConfigFile(fileName)?.type,
    // lynxp pull writes the blueprint back to this path
    repository_path: fileName,
  });
  const blueprintId = response.blueprint.id;
  const regenerated = regenerate(blueprintId);
  const written = regenerated[fileName];
  if (written !== undefined && written !== content) {
    try {
      await api.updateBlueprint(blueprintId, { content: written, expected_checksum: calculateChecksum(content) });
      syncedFile.uploadedContent = written;
    } catch {
      // The blueprint keeps the first upload; tracking records the file as written
    }
  }
  return { blueprintId, files: regenerated, syncedFile };
}
