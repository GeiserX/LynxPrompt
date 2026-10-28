import { describe, it, expect } from "vitest";
import { markdownToHtml } from "@/lib/blog-markdown";

describe("blog markdownToHtml", () => {
  it("renders a blockquote", () => {
    expect(markdownToHtml("> quoted line")).toContain("<blockquote>quoted line</blockquote>");
  });

  it("wraps ordered items in <ol>, not <ul>", () => {
    const html = markdownToHtml("1. one\n2. two");
    expect(html).toContain("<ol><li>one</li><li>two</li></ol>");
    expect(html).not.toContain("<ul>");
  });

  it("nests an indented list inside its parent item", () => {
    const html = markdownToHtml("- parent\n  - child\n- next");
    expect(html).toBe("<ul><li>parent<ul><li>child</li></ul></li><li>next</li></ul>");
  });

  it("leaves markdown inside a fenced code block alone", () => {
    const html = markdownToHtml("```sh\n# not a heading\n- not a list\n**not bold**\n```");
    expect(html).toBe(
      '<pre><code class="language-sh"># not a heading\n- not a list\n**not bold**\n</code></pre>'
    );
  });

  it("does not read a '* item' marker as italics", () => {
    expect(markdownToHtml("* a *b*")).toBe("<ul><li>a <em>b</em></li></ul>");
  });

  it("still escapes HTML and drops javascript: links", () => {
    const html = markdownToHtml('<script>x</script> [go](javascript:alert(1))');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });
});
