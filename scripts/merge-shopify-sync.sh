#!/usr/bin/env bash
# Merge the Shopify editor commits ("Update from Shopify") of a store branch into the local branch.
# Store content wins for editor-owned JSON (settings_data, templates, section groups);
# theme code (Liquid, CSS, JS, schemas) keeps the local version.
# Usage: scripts/merge-shopify-sync.sh <remote-branch>
set -euo pipefail
branch="${1:?remote branch}"
git fetch -q origin "$branch"
if git merge --no-edit "origin/$branch" >/dev/null 2>&1; then
  echo "Merged cleanly."
else
  for f in $(git diff --name-only --diff-filter=U); do
    case "$f" in
      config/settings_data.json|templates/*.json|sections/*-group.json) git checkout --theirs -- "$f" ;;
      *) git checkout --ours -- "$f" ;;
    esac
    git add "$f"
  done
  git commit -q --no-edit
  echo "Merged with store content preferred for editor JSON."
fi
python3 scripts/validate-templates.py
