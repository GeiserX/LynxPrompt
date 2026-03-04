# LynxPrompt CLI Demo — Full Workflow

Output "demo.gif"

Require lynxp

Set Shell "zsh"
Set FontSize 17
Set FontFamily "Menlo"
Set Width 1400
Set Height 900
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
Type "rm -rf .cursor/ .github/ CLAUDE.md .lynxprompt/ src/web/AGENTS.md AGENTS.md 2>/dev/null"
Enter
Sleep 500ms
Type "clear"
Enter
Sleep 500ms
Show

# --- 1. Interactive Wizard — 12 configuration steps ---
Sleep 300ms
Type@30ms "echo '>> Interactive wizard — 12 configuration steps'"
Sleep 500ms
Enter
Sleep 400ms
Type "lynxp wizard -f agents,cursor,copilot"
Sleep 900ms
Enter
Sleep 2s

# Slow pace — viewers read the first questions (15 Enters @ 700ms)
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms
Enter
Sleep 700ms

# Medium pace (20 Enters @ 500ms)
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms
Enter
Sleep 500ms

# Faster pace (25 Enters @ 350ms)
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms
Enter
Sleep 350ms

# Fast pace (30 Enters @ 300ms)
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

# Wait for generation to complete (viewer sees the result)
Sleep 10s

# Flush any leftover input and clear screen
Hide
Ctrl+C
Sleep 500ms
Type "clear"
Enter
Sleep 500ms
Show

# --- 2. Validate config ---
Type@30ms "echo '>> Validate config (CI-ready)'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp check"
Sleep 800ms
Enter
Sleep 3s

# --- 3. Push to cloud ---
Type@30ms "echo '>> Push to LynxPrompt Cloud'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp push AGENTS.md -y"
Sleep 800ms
Enter
Sleep 5s

# --- 4. Search marketplace ---
Type@30ms "echo '>> Discover community blueprints'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp search go --limit 3"
Sleep 800ms
Enter
Sleep 4s

# --- 5. Preview a community blueprint ---
Type@30ms "echo '>> Preview before downloading'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp pull bp_cmjnbxw7o000501l1vdetgrua --preview"
Sleep 900ms
Enter
Sleep 5s

# --- 6. Edit locally + show diff ---
Type@30ms "echo '>> Edit locally, then view the diff'"
Sleep 500ms
Enter
Sleep 300ms
Type@30ms "echo 'Always use Python type hints for public APIs.' >> AGENTS.md && lynxp diff"
Sleep 900ms
Enter
Sleep 5s

# --- 7. Push the update ---
Type@30ms "echo '>> Push the update (v2)'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp push -y"
Sleep 800ms
Enter
Sleep 4s

# --- 8. Analyze remote repo ---
Type@30ms "echo '>> Analyze any GitHub repo without cloning'"
Sleep 500ms
Enter
Sleep 300ms
Type "lynxp analyze -r https://github.com/GeiserX/Telegram-Archive"
Sleep 900ms
Enter
Sleep 5s

Sleep 2s
