/**
 * Find invisible Unicode characters in an AI rule file.
 *
 * A rule file is read by an agent as instructions. Zero-width characters,
 * bidi controls and Unicode tag characters render as nothing (or reorder what
 * a reviewer sees), so they can carry instructions the agent follows and the
 * person reviewing the file never sees. Nothing is stripped: this only reports.
 *
 * Legitimate uses are not reported:
 * - a byte order mark at the very start of the file;
 * - one zero-width joiner or non-joiner, or one direction mark, between two
 *   visible non-ASCII characters (emoji sequences such as a family emoji, Persian
 *   and Indic words, right-to-left text);
 * - the tag sequence of the England, Scotland and Wales flags (the only
 *   subdivision flags in the recommended emoji set).
 *
 * A lone direction mark (LRM, RLM, ALM) next to plain text is kept apart as a
 * warning: mixed right-to-left and English text uses them on purpose, and a
 * mark only changes how neutral characters around it are ordered. A mark that
 * sits in a run of other hidden characters is still an error.
 */

export interface HiddenChar {
  line: number;
  column: number;
  /** "U+200B" */
  codePoint: string;
  name: string;
}

const NAMES: Record<number, string> = {
  0x061c: "ARABIC LETTER MARK",
  0x180e: "MONGOLIAN VOWEL SEPARATOR",
  0x200b: "ZERO WIDTH SPACE",
  0x200c: "ZERO WIDTH NON-JOINER",
  0x200d: "ZERO WIDTH JOINER",
  0x200e: "LEFT-TO-RIGHT MARK",
  0x200f: "RIGHT-TO-LEFT MARK",
  0x202a: "LEFT-TO-RIGHT EMBEDDING",
  0x202b: "RIGHT-TO-LEFT EMBEDDING",
  0x202c: "POP DIRECTIONAL FORMATTING",
  0x202d: "LEFT-TO-RIGHT OVERRIDE",
  0x202e: "RIGHT-TO-LEFT OVERRIDE",
  0x2060: "WORD JOINER",
  0x2061: "FUNCTION APPLICATION",
  0x2062: "INVISIBLE TIMES",
  0x2063: "INVISIBLE SEPARATOR",
  0x2064: "INVISIBLE PLUS",
  0x2066: "LEFT-TO-RIGHT ISOLATE",
  0x2067: "RIGHT-TO-LEFT ISOLATE",
  0x2068: "FIRST STRONG ISOLATE",
  0x2069: "POP DIRECTIONAL ISOLATE",
  0xfeff: "ZERO WIDTH NO-BREAK SPACE",
};

// Allowed between two visible non-ASCII characters
const CONTEXTUAL = new Set([0x061c, 0x200c, 0x200d, 0x200e, 0x200f]);
// Only a warning when alone next to plain text
const DIRECTION_MARKS = new Set([0x061c, 0x200e, 0x200f]);

const BLACK_FLAG = 0x1f3f4;
const CANCEL_TAG = 0xe007f;

const isTag = (cp: number) => cp >= 0xe0000 && cp <= 0xe007f;
// Variation selectors 17-256: invisible, and enough of them can encode any bytes
const isVariationSelectorSupplement = (cp: number) => cp >= 0xe0100 && cp <= 0xe01ef;

function isHidden(cp: number): boolean {
  return cp in NAMES || isTag(cp) || isVariationSelectorSupplement(cp);
}

function nameOf(cp: number): string {
  if (cp in NAMES) return NAMES[cp];
  if (isTag(cp)) return "TAG CHARACTER";
  return "VARIATION SELECTOR";
}

// The only subdivision flags in Unicode's recommended (RGI) emoji set: England, Scotland, Wales.
// Any other tag run after a black flag is not a flag an emoji keyboard produces, so it is reported.
const RGI_SUBDIVISIONS = new Set(["gbeng", "gbsct", "gbwls"]);

/** Length of the subdivision-flag tag run starting at i (right after U+1F3F4 black flag), or 0 if it is not one */
function flagTagRunLength(cps: number[], i: number): number {
  if (cps[i - 1] !== BLACK_FLAG) return 0;
  let j = i;
  while (j < cps.length && cps[j] >= 0xe0020 && cps[j] < CANCEL_TAG) j++;
  if (cps[j] !== CANCEL_TAG) return 0;
  const code = String.fromCharCode(...cps.slice(i, j).map((cp) => cp - 0xe0000));
  return RGI_SUBDIVISIONS.has(code) ? j - i + 1 : 0;
}

const isVisibleNonAscii = (cp: number | undefined) =>
  cp !== undefined && cp > 0x7f && !isHidden(cp);

function scan(content: string): { hidden: HiddenChar[]; marks: HiddenChar[] } {
  const cps = Array.from(content, (c) => c.codePointAt(0) as number);
  const hidden: HiddenChar[] = [];
  const marks: HiddenChar[] = [];
  let line = 1;
  let column = 0;

  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (cp === 0x0a) {
      line++;
      column = 0;
      continue;
    }
    column++;
    if (!isHidden(cp)) continue;

    if (cp === 0xfeff && i === 0) continue;
    if (CONTEXTUAL.has(cp) && isVisibleNonAscii(cps[i - 1]) && isVisibleNonAscii(cps[i + 1])) continue;
    const flagRun = flagTagRunLength(cps, i);
    if (flagRun > 0) {
      i += flagRun - 1;
      column += flagRun - 1;
      continue;
    }

    const found = {
      line,
      column,
      codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      name: nameOf(cp),
    };
    // A leading byte order mark does not make a run
    const hiddenAt = (j: number) => j > 0 && j < cps.length && isHidden(cps[j]);
    const alone = !hiddenAt(i - 1) && !hiddenAt(i + 1);
    (DIRECTION_MARKS.has(cp) && alone ? marks : hidden).push(found);
  }
  return { hidden, marks };
}

/** Hidden characters that can carry instructions: each one is a check error */
export function findHiddenUnicode(content: string): HiddenChar[] {
  return scan(content).hidden;
}

/** Lone direction marks next to plain text: each one is a check warning */
export function findDirectionMarks(content: string): HiddenChar[] {
  return scan(content).marks;
}

function positions(found: HiddenChar[], shown: number): string {
  const where = found
    .slice(0, shown)
    .map((h) => `line ${h.line} col ${h.column} ${h.codePoint} ${h.name}`)
    .join("; ");
  return found.length > shown ? `${where}; and ${found.length - shown} more` : where;
}

/** One check message for a file, naming where the first few characters are */
export function describeHiddenUnicode(filename: string, found: HiddenChar[], shown = 5): string {
  const n = found.length;
  return `${filename}: ${n} hidden Unicode character${n === 1 ? "" : "s"} that can carry instructions a reviewer cannot see (${positions(found, shown)})`;
}

/** One warning for a file's lone direction marks */
export function describeDirectionMarks(filename: string, found: HiddenChar[], shown = 5): string {
  const n = found.length;
  return `${filename}: ${n} invisible direction mark${n === 1 ? "" : "s"} next to plain text, usual in right-to-left text; remove ${n === 1 ? "it" : "them"} if you did not add ${n === 1 ? "it" : "them"} (${positions(found, shown)})`;
}
