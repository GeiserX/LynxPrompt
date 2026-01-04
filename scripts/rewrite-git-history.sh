#!/bin/bash
# =============================================================================
# Git History Rewrite Script for LynxPrompt
# =============================================================================
#
# This script rewrites the entire git history to change the author/committer
# from the old identity to GeiserX.
#
# ⚠️  WARNING: This is a destructive operation!
# - It will rewrite ALL commits in the repository
# - You will need to force-push to remote after running this
# - All existing clones will need to be re-cloned or reset
#
# BEFORE RUNNING:
# 1. Make sure you have no uncommitted changes
# 2. Back up your repository if needed
# 3. Review the OLD_EMAIL and NEW_* values below
#
# =============================================================================

set -e

# Configuration
OLD_EMAIL="sergio.fernandez.-nd@disney.com"
OLD_NAME="FERNS154"

NEW_NAME="GeiserX"
NEW_EMAIL="9169332+GeiserX@users.noreply.github.com"

echo "=============================================="
echo "Git History Rewrite Script"
echo "=============================================="
echo ""
echo "This will rewrite ALL commits to change:"
echo "  FROM: $OLD_NAME <$OLD_EMAIL>"
echo "  TO:   $NEW_NAME <$NEW_EMAIL>"
echo ""
echo "Current commit count: $(git rev-list --count HEAD)"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Confirm
read -p "Are you sure you want to proceed? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Starting git history rewrite..."
echo ""

# Use git-filter-repo if available (preferred), otherwise fall back to filter-branch
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (recommended)..."
    
    # Create a mailmap file for the rewrite
    cat > /tmp/mailmap <<EOF
$NEW_NAME <$NEW_EMAIL> $OLD_NAME <$OLD_EMAIL>
$NEW_NAME <$NEW_EMAIL> <$OLD_EMAIL>
EOF
    
    git filter-repo --mailmap /tmp/mailmap --force
    
    rm /tmp/mailmap
else
    echo "Using git filter-branch (slower, but works)..."
    echo "Note: Consider installing git-filter-repo for better performance."
    echo ""
    
    git filter-branch -f --env-filter '
        if [ "$GIT_COMMITTER_EMAIL" = "'"$OLD_EMAIL"'" ] || [ "$GIT_AUTHOR_EMAIL" = "'"$OLD_EMAIL"'" ]; then
            export GIT_COMMITTER_NAME="'"$NEW_NAME"'"
            export GIT_COMMITTER_EMAIL="'"$NEW_EMAIL"'"
            export GIT_AUTHOR_NAME="'"$NEW_NAME"'"
            export GIT_AUTHOR_EMAIL="'"$NEW_EMAIL"'"
        fi
    ' --tag-name-filter cat -- --branches --tags
    
    # Clean up refs
    git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true
fi

echo ""
echo "=============================================="
echo "✅ Git history rewritten successfully!"
echo "=============================================="
echo ""
echo "New commit count: $(git rev-list --count HEAD)"
echo ""
echo "Next steps:"
echo "1. Verify the changes: git log --oneline -10"
echo "2. Set your local git config:"
echo "   git config user.name \"$NEW_NAME\""
echo "   git config user.email \"$NEW_EMAIL\""
echo "3. Force push to remote:"
echo "   git push --force-with-lease origin main"
echo ""
echo "⚠️  Remember: Anyone with existing clones will need to re-clone!"









