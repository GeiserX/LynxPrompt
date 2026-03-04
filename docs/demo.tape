# LynxPrompt CLI Demo — Full Workflow
# analyze → wizard (interactive) → check → push → edit → diff → push v2 → search → pull

Output "demo.gif"

Require lynxp

Set Shell "zsh"
Set FontSize 20
Set FontFamily "Menlo"
Set Width 1250
Set Height 850
Set Theme "Dracula"
Set WindowBar Colorful
Set WindowBarSize 40
Set Padding 16
Set TypingSpeed 25ms
Set Framerate 15
Set CursorBlink false

# Hidden setup
Hide
Type "setopt INTERACTIVE_COMMENTS"
Enter
Sleep 200ms
Type "export PS1='$ '"
Enter
Sleep 300ms
Type "cd ~/repos/personal/Telegram-Archive"
Enter
Sleep 300ms
Type "rm -rf .cursor/ .github/ CLAUDE.md .lynxprompt/ src/web/AGENTS.md 2>/dev/null; git checkout -- AGENTS.md 2>/dev/null"
Enter
Sleep 500ms
Type "clear"
Enter
Sleep 500ms
Show

# --- 1. Analyze a remote GitHub repo ---
Sleep 300ms
Type "# Analyze any GitHub repo without cloning"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp analyze -r https://github.com/GeiserX/Telegram-Archive"
Sleep 900ms
Enter
Sleep 5s

# --- 2. Interactive Wizard — show all the questions ---
Type "# Interactive wizard with 12 configuration steps"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp wizard -f agents,cursor,copilot"
Sleep 900ms
Enter
Sleep 2s

# First few questions — slow, so users can see them
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms
Enter
Sleep 600ms

# Speed up — rapid Enter to show the breadth of options
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms
Enter
Sleep 300ms

# Even faster — blast through remaining steps
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms

# Final batch — make sure wizard completes
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms
Enter
Sleep 200ms

# Extra batch — safety margin
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms
Enter
Sleep 150ms

# Wait for wizard to finish generating
Sleep 8s

# --- 3. Validate config ---
Type "# Validate your config (CI-ready)"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp check"
Sleep 800ms
Enter
Sleep 3s

# --- 4. Push to cloud ---
Type "# Push to LynxPrompt Cloud"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp push AGENTS.md -y"
Sleep 800ms
Enter
Sleep 5s

# --- 5. Edit + Diff ---
Type "# Edit locally, then view the diff"
Sleep 700ms
Enter
Sleep 200ms
Type@30ms "echo 'Always use Python type hints for public APIs.' >> AGENTS.md && lynxp diff"
Sleep 900ms
Enter
Sleep 5s

# --- 6. Push update ---
Type "# Push the update"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp push -y"
Sleep 800ms
Enter
Sleep 4s

# --- 7. Search marketplace ---
Type "# Discover community blueprints"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp search go --limit 3"
Sleep 800ms
Enter
Sleep 4s

# --- 8. Preview a community blueprint ---
Type "# Preview before downloading"
Sleep 700ms
Enter
Sleep 200ms
Type "lynxp pull bp_cmjnbxw7o000501l1vdetgrua --preview"
Sleep 900ms
Enter
Sleep 6s

Sleep 2s
