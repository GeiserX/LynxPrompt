// Small markdown renderer for blog posts. Input is escaped first, so the only
// HTML in the output is what this function writes.

// Validate URL for safe protocols (prevent javascript: XSS)
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  // Only allow http, https, mailto, and relative URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") ||
      trimmed.startsWith("mailto:") || trimmed.startsWith("/") ||
      trimmed.startsWith("#") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }
  // Block javascript:, data:, vbscript:, and other potentially dangerous protocols
  if (trimmed.includes(":")) {
    return false;
  }
  // Allow relative URLs without protocol
  return true;
}

// Turns runs of "- item" / "1. item" lines into <ul>/<ol>, nesting by indent.
function renderLists(html: string): string {
  const out: string[] = [];
  const stack: { type: "ul" | "ol"; indent: number }[] = [];
  let block = "";

  const closeOne = () => {
    block += `</li></${stack.pop()!.type}>`;
  };
  const open = (type: "ul" | "ol", indent: number, text: string) => {
    block += `<${type}><li>${text}`;
    stack.push({ type, indent });
  };
  const flush = () => {
    while (stack.length) closeOne();
    if (block) out.push(block);
    block = "";
  };

  for (const line of html.split("\n")) {
    const m = /^([ \t]*)([-*]|\d+\.)[ \t]+(.*)$/.exec(line);
    if (!m) {
      flush();
      out.push(line);
      continue;
    }
    const indent = m[1].replace(/\t/g, "    ").length;
    const type = /\d/.test(m[2]) ? "ol" : "ul";
    const text = m[3];

    while (stack.length && stack[stack.length - 1].indent > indent) closeOne();
    const top = stack[stack.length - 1];
    if (!top || top.indent < indent) {
      open(type, indent, text); // first item, or a nested list inside the open item
    } else if (top.type === type) {
      block += `</li><li>${text}`;
    } else {
      closeOne(); // same level, other list kind: end this list, start the other
      open(type, indent, text);
    }
  }
  flush();
  return out.join("\n");
}

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Set code aside first so nothing below rewrites what is inside it
  const code: string[] = [];
  const stash = (fragment: string) => `\u0000${code.push(fragment) - 1}\u0000`;
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_m, lang, body) => stash(`<pre><code class="language-${lang}">${body}</code></pre>`)
  );
  html = html.replace(/`([^`\n]+)`/g, (_m, body) => stash(`<code>${body}</code>`));

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Lists before emphasis, so a "* item" marker is not read as italics
  html = renderLists(html);

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Links - with URL validation to prevent javascript: XSS
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      // Code set aside above is put back raw, quotes and all, so it must
      // never land inside the href; leave such a link as text
      if (url.includes("\u0000")) return match;
      if (isSafeUrl(url)) {
        // HTML-encode the URL to prevent attribute injection
        const safeUrl = url
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      // For unsafe URLs, render as plain text
      return text;
    }
  );

  // Blockquotes (">" was escaped above)
  html = html.replace(/^&gt;\s?(.*)$/gm, "<blockquote>$1</blockquote>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";

  // Put the code back
  html = html.replace(/\u0000(\d+)\u0000/g, (_m, i) => code[Number(i)]);

  // Clean up empty paragraphs and paragraphs around block elements
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>\s*(<(?:h[1-6]|ul|ol|pre|blockquote|hr)[\s>/])/g, "$1");
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|pre|blockquote)>|<hr \/>)\s*<\/p>/g, "$1");

  return html;
}
