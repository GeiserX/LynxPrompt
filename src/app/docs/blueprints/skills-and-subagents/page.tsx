import { Puzzle } from "lucide-react";

export const metadata = {
  title: "Agent Skills & Subagents",
  description:
    "Store one Agent Skill or subagent in LynxPrompt and write it to the folder of every coding agent: .agents/skills, .claude/skills, .claude/agents, .agents/agents, Copilot and Codex.",
};

const code = "rounded bg-muted px-1.5 py-0.5";

export default function SkillsAndSubagentsDocsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 p-2">
            <Puzzle className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Skills &amp; Subagents</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A skill is a folder with a <code>SKILL.md</code> that an agent loads when the task calls
          for it. A subagent is a named agent with its own instructions that the main agent can hand
          work to. Store each one once in LynxPrompt; the download and <code>lynxp pull</code> write
          it to the folders the agents read.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Agent Skills</h2>
        <p className="text-muted-foreground">
          A skill blueprint holds one <code>SKILL.md</code>: frontmatter with <code>name</code> and{" "}
          <code>description</code>, then the instructions. The name is 1 to 64 lowercase letters,
          digits and hyphens, with no hyphen at either end and no two in a row, and it is the folder
          name. LynxPrompt refuses a name that breaks this, because Copilot, Junie and Cline refuse
          to load such a skill.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-semibold">Written to</th>
                <th className="pb-3 pr-4 font-semibold">When</th>
                <th className="pb-3 font-semibold">Read by</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4"><code className={code}>.agents/skills/&lt;name&gt;/SKILL.md</code></td>
                <td className="py-3 pr-4">Always</td>
                <td className="py-3">Codex, Cursor, Copilot, Gemini CLI, Antigravity, OpenCode, Zed, Junie, Devin, Cline, Kilo, Goose, Amp, Augment, Trae, Factory, Qwen Code, Kimi Code, Mistral Vibe, Pi, Warp, Crush, OpenHands and more</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.claude/skills/&lt;name&gt;/SKILL.md</code></td>
                <td className="py-3 pr-4">Always</td>
                <td className="py-3">Claude Code, which reads only this folder</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.kiro/skills/&lt;name&gt;/SKILL.md</code></td>
                <td className="py-3 pr-4">When you pick Kiro</td>
                <td className="py-3">Kiro</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.firebender/skills/&lt;name&gt;/SKILL.md</code></td>
                <td className="py-3 pr-4">When you pick Firebender</td>
                <td className="py-3">Firebender</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          The <code>.claude/skills</code> copy is the skill as you wrote it. The other copies keep only
          the fields of the Agent Skills format (<code>name</code>, <code>description</code>,{" "}
          <code>license</code>, <code>compatibility</code>, <code>metadata</code>,{" "}
          <code>allowed-tools</code>), so Claude-only fields such as <code>when_to_use</code>,{" "}
          <code>context</code>, <code>paths</code>, <code>hooks</code> or <code>model</code> stay where
          Claude Code reads them. A blueprint holds the <code>SKILL.md</code> only, not scripts or
          other files in the skill folder.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Subagents</h2>
        <p className="text-muted-foreground">
          A subagent blueprint holds one Markdown file: frontmatter with <code>name</code> and{" "}
          <code>description</code> (plus any Claude Code fields such as <code>tools</code> or{" "}
          <code>model</code>), then the agent&apos;s instructions.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-semibold">Written to</th>
                <th className="pb-3 pr-4 font-semibold">When</th>
                <th className="pb-3 font-semibold">Read by</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4"><code className={code}>.claude/agents/&lt;name&gt;.md</code></td>
                <td className="py-3 pr-4">Always, as written</td>
                <td className="py-3">Claude Code, Cursor, Copilot in VS Code, Goose</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.agents/agents/&lt;name&gt;.md</code></td>
                <td className="py-3 pr-4">Always, name and description only</td>
                <td className="py-3">Antigravity, Goose, OpenHands, Kimi Code, Devin CLI</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.github/agents/&lt;name&gt;.agent.md</code></td>
                <td className="py-3 pr-4">When you pick Copilot</td>
                <td className="py-3">GitHub Copilot</td>
              </tr>
              <tr>
                <td className="py-3 pr-4"><code className={code}>.codex/agents/&lt;name&gt;.toml</code></td>
                <td className="py-3 pr-4">When you pick Codex</td>
                <td className="py-3">OpenAI Codex (<code>name</code>, <code>description</code>, <code>developer_instructions</code>)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          <code>lynxp push</code> also picks up subagents in <code>.cursor/agents</code>,{" "}
          <code>.gemini/agents</code>, <code>.opencode/agents</code>, <code>.kiro/agents</code>,{" "}
          <code>.junie/agents</code>, <code>.factory/droids</code>, <code>.qwen/agents</code>,{" "}
          <code>.augment/agents</code>, <code>.trae/agents</code>, <code>.kilo/agents</code>,{" "}
          <code>.cline/agents</code> and <code>.devin/agents</code>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Web and CLI</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            On the web, pick <strong>Agent Skill</strong> or <strong>Subagent</strong> as the format
            when you create a blueprint. Its download is a <code>.zip</code> that unpacks into the
            project root with every copy; tick Kiro, Firebender, Copilot or Codex to add theirs.
          </li>
          <li>
            <code>lynxp pull</code> writes the same copies, adding Kiro, Firebender, Copilot or Codex
            when the project already has their folder (<code>.kiro</code>, <code>.firebender</code>,{" "}
            <code>.github/agents</code>, <code>.codex</code>). One copy is tracked; the others are
            plain copies, never symlinks. A copy you already have with different content is kept,
            with a warning, unless you pass <code>--yes</code>.
          </li>
          <li>
            <code>lynxp push</code> recognises a skill or subagent in any of the folders above. With{" "}
            <code>--all</code>, the copies LynxPrompt writes are pushed once, and after a push or{" "}
            <code>lynxp sync</code> the copies already in the project are rewritten from it. A skill
            in another tool&apos;s own folder, such as <code>.github/skills</code>, is pushed on its
            own. A subagent stored as Codex TOML or Kiro JSON keeps its single file and path.
          </li>
          <li>
            <code>lynxp convert .claude/agents/reviewer.md codex-agent</code> writes one copy for
            another tool. Targets: <code>shared-skill</code>, <code>claude-skill</code>,{" "}
            <code>kiro-skill</code>, <code>firebender-skill</code>, <code>claude-agent</code>,{" "}
            <code>shared-agent</code>, <code>copilot-agent</code>, <code>codex-agent</code>.
          </li>
        </ul>
      </section>
    </div>
  );
}
