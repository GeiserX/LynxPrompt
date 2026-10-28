/**
 * Answers the wizard should not ask again: saved draft answers, then explicit flags.
 * prompts skips any question whose name has an override.
 */
export function buildPromptOverrides(
  draftAnswers: Record<string, unknown> | undefined,
  options: { license?: string; ciCd?: string; projectType?: string }
): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draftAnswers || {})) {
    if (value !== undefined && value !== null) overrides[key] = value;
  }
  if (options.license) overrides.license = options.license;
  if (options.ciCd) overrides.cicd = options.ciCd.split(",").map(c => c.trim()).filter(Boolean);
  if (options.projectType) overrides.projectType = options.projectType;
  return overrides;
}
