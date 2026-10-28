/**
 * Markdown section parsing and merging for 'lynxp merge'.
 * Kept free of CLI dependencies so it can be unit tested.
 */

export interface ConfigSection {
  title: string;
  level: number;   // Heading level (1-3); 0 for text before the first heading
  content: string;
  source: string;
}

/**
 * Split Markdown into sections at #, ## and ### headings.
 * Lines inside ``` or ~~~ fences are content, never headings, so a "# comment"
 * in a shell example does not split the fence in two.
 */
export function parseMarkdownSections(content: string, sourceName: string): ConfigSection[] {
  const sections: ConfigSection[] = [];
  let current: ConfigSection | null = null;
  let fence: string | null = null;
  const lines: string[] = [];

  const flush = () => {
    if (current) {
      current.content = lines.join("\n");
      sections.push(current);
    } else if (lines.join("").trim()) {
      sections.push({ title: "Introduction", level: 0, content: lines.join("\n"), source: sourceName });
    }
    lines.length = 0;
  };

  for (const line of content.split("\n")) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      lines.push(line);
      continue;
    }
    const heading = fence === null ? line.match(/^(#{1,3})\s+(.+)$/) : null;
    if (heading) {
      flush();
      current = { title: heading[2].trim(), level: heading[1].length, content: "", source: sourceName };
      continue;
    }
    lines.push(line);
  }
  flush();

  return sections;
}

function renderSection(section: ConfigSection, body: string = section.content.trim()): string {
  if (section.level === 0) return body;
  const heading = `${"#".repeat(section.level)} ${section.title}`;
  return body ? `${heading}\n\n${body}` : heading;
}

export function mergeSectionsByStrategy(
  allSections: ConfigSection[][],
  strategy: "concat" | "sections" | "smart"
): string {
  switch (strategy) {
    case "concat":
      // Simple concatenation with separators
      return allSections
        .map((sections, i) => {
          const sourceName = sections[0]?.source || `Source ${i + 1}`;
          const content = sections.map(s => renderSection(s)).join("\n\n");
          
          return `<!-- From: ${sourceName} -->\n${content}`;
        })
        .join("\n\n---\n\n");

    case "sections": {
      // Group by section title, in the order titles first appear
      const sectionMap = new Map<string, ConfigSection[]>();
      
      for (const fileSections of allSections) {
        for (const section of fileSections) {
          const normalized = section.title.toLowerCase();
          if (!sectionMap.has(normalized)) {
            sectionMap.set(normalized, []);
          }
          sectionMap.get(normalized)!.push(section);
        }
      }
      
      const merged: string[] = [];
      
      for (const [, sections] of sectionMap) {
        if (sections.length === 1) {
          merged.push(renderSection(sections[0]));
        } else {
          // Multiple sources for same section - combine
          const combinedContent = sections
            .map(s => `<!-- From: ${s.source} -->\n${s.content.trim()}`)
            .join("\n\n");
          merged.push(renderSection(sections[0], combinedContent));
        }
      }
      
      return merged.join("\n\n");
    }

    case "smart":
    default: {
      // Smart merge: keep every section in source order and drop exact duplicates
      // (same heading and same text after whitespace normalisation)
      const seen = new Set<string>();
      const result: string[] = [];
      
      for (const section of allSections.flat()) {
        const key = `${section.level}|${section.title.toLowerCase()}|${section.content.toLowerCase().replace(/\s+/g, " ").trim()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(renderSection(section));
      }
      
      return result.join("\n\n");
    }
  }
}
