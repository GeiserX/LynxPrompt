// @vitest-environment node
//
// eslint-plugin-react, eslint-plugin-jsx-a11y and eslint-plugin-import call
// require("minimatch")(...) with the 3.x API, while the root override pins
// minimatch to the patched 11.x, which has no callable export.
// tools/eslint-minimatch-compat.cjs, loaded first by eslint.config.mjs, gives
// those plugins the 3.x shape over minimatch 11. Each case lints through the
// repo's own eslint.config.mjs with one plugin rule enabled with a glob option,
// and checks it runs without throwing and that the glob really matched (the
// matching element is not reported).
import { createRequire } from "module";
import path from "path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { ESLint } = require("eslint");
const root = path.resolve(__dirname, "../..");

type Case = {
  rule: string;
  options: unknown[];
  code: string;
  reported: number;
};

const cases: Case[] = [
  {
    rule: "react/forbid-component-props",
    options: [{ forbid: [{ propName: "className", allowedForPatterns: ["*Icon"] }] }],
    code: `const a = <><SearchIcon className="a" /><Button className="b" /></>;`,
    reported: 1,
  },
  {
    rule: "react/jsx-handler-names",
    options: [{ ignoreComponentNames: ["Legacy*"] }],
    code: `const a = <><LegacyField onChange={this.doThing} /><Field onChange={this.doThing} /></>;`,
    reported: 1,
  },
  {
    rule: "react/jsx-pascal-case",
    options: [{ ignore: ["Legacy_*"] }],
    code: `const a = <><Legacy_Widget /><Other_Widget /></>;`,
    reported: 1,
  },
  {
    rule: "react/no-danger",
    options: [{ customComponentNames: ["Rich*"] }],
    code: `const a = <><RichText dangerouslySetInnerHTML={{ __html: x }} /><Plain dangerouslySetInnerHTML={{ __html: x }} /></>;`,
    reported: 1,
  },
  {
    rule: "react/no-unstable-nested-components",
    options: [{ propNamePattern: "draw*" }],
    code: `function Page() { return <List drawItem={() => <div />} footer={() => <div />} />; }`,
    reported: 1,
  },
  {
    rule: "jsx-a11y/label-has-associated-control",
    options: [{ controlComponents: ["Custom*"], assert: "nesting", depth: 3 }],
    code: `const a = <><label>Name<CustomInput /></label><label>Name<Other /></label></>;`,
    reported: 1,
  },
  {
    rule: "import/order",
    options: [
      {
        groups: ["builtin", "external", "internal"],
        pathGroups: [{ pattern: "~/**", group: "builtin", position: "before" }],
      },
    ],
    code: `import fs from "fs";\nimport a from "~/a";\nexport { a, fs };`,
    reported: 1,
  },
  {
    rule: "import/no-namespace",
    options: [{ ignore: ["*.ext"] }],
    code: `import * as a from "./a.ext";\nimport * as b from "./b";\nexport { a, b };`,
    reported: 1,
  },
  {
    rule: "import/no-unassigned-import",
    options: [{ allow: ["**/*.css"] }],
    code: `import "./a.css";\nimport "./b";`,
    reported: 1,
  },
  {
    rule: "import/no-internal-modules",
    options: [{ allow: ["react-dom/*"] }],
    code: `import a from "react-dom/server";\nimport b from "next/dist/server/web/spec-extension/request";\nexport { a, b };`,
    reported: 1,
  },
];

async function lint({ rule, options, code }: Case) {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: path.join(root, "eslint.config.mjs"),
    overrideConfig: { rules: { [rule]: ["error", ...options] } },
  });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(root, "src", "minimatch-compat-fixture.jsx"),
  });
  return result.messages as { ruleId: string | null; fatal?: boolean; message: string }[];
}

describe("eslint plugins on the minimatch 11 compat shim", () => {
  it.each(cases)("$rule runs with glob options", async (c) => {
    const messages = await lint(c);
    expect(messages.filter((m) => m.fatal || m.ruleId === null)).toEqual([]);
    expect(messages.filter((m) => m.ruleId === c.rule)).toHaveLength(c.reported);
  });

  it("hands the plugins a callable minimatch backed by minimatch 11", async () => {
    await lint(cases[0]);
    for (const plugin of ["eslint-plugin-react", "eslint-plugin-jsx-a11y", "eslint-plugin-import"]) {
      const mm = createRequire(require.resolve(`${plugin}/package.json`))("minimatch");
      expect(typeof mm, plugin).toBe("function");
      expect(mm("src/a.ts", "src/*.ts"), plugin).toBe(true);
      expect(typeof mm.Minimatch, plugin).toBe("function");
      expect(typeof mm.makeRe, plugin).toBe("function");
      expect(mm.__esModule, plugin).toBeUndefined();
    }
    expect(require("minimatch/package.json").version).toMatch(/^11\./);
  });
});
