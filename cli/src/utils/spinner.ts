import ora, { type Ora, type Options } from "ora";

/**
 * ora, but static when the terminal reports zero columns. ora divides the text
 * width by the column count to know how many lines to clear, so a terminal
 * that says it is 0 columns wide (some CI and container ptys) got an endless
 * stream of erase codes instead of a spinner.
 */
export function createSpinner(options?: string | Options): Ora {
  const opts: Options = typeof options === "string" ? { text: options } : { ...options };
  const stream = (opts.stream ?? process.stderr) as Partial<NodeJS.WriteStream>;
  const zeroColumns = stream.isTTY === true && !((stream.columns ?? 80) >= 1);
  return ora(zeroColumns && opts.isEnabled === undefined ? { ...opts, isEnabled: false } : opts);
}
