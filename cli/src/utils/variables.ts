/**
 * Blueprint variables: [[NAME]] and [[NAME|default]] placeholders.
 *
 * The pattern is a copy of VARIABLE_PATTERN_SOURCE in src/lib/file-generator.ts
 * (the web app), so a file pulled with `lynxp pull --vars` is filled the way the
 * web download fills it. tests/cli/variables.test.ts checks the two agree.
 * Names are case-insensitive: [[repo_url]] and [[REPO_URL]] are one variable.
 */
export const VARIABLE_PATTERN_SOURCE = String.raw`\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|((?:(?!\[\[)[\s\S])*?)\]\](?!\])|\]\])`;

/**
 * Replace each placeholder with its value from `values` (keys in upper case),
 * else with the placeholder's own default. A placeholder with neither stays in
 * the text and is returned in `missing`.
 */
export function fillBlueprintVariables(
  content: string,
  values: Record<string, string>
): { content: string; missing: string[] } {
  const missing = new Set<string>();
  const filled = content.replace(
    new RegExp(VARIABLE_PATTERN_SOURCE, "g"),
    (match: string, name: string, fallback: string | undefined) => {
      const key = name.toUpperCase();
      if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
      if (fallback !== undefined) return fallback;
      missing.add(key);
      return match;
    }
  );
  return { content: filled, missing: [...missing] };
}
