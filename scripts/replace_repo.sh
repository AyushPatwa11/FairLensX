#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 /path/to/new_code [--push]"
  echo "Runs inside a local clone of the remote repo to replace its contents with the provided folder." 
  exit 1
}

if [ "$#" -lt 1 ]; then
  usage
fi

NEW_DIR="$1"
PUSH_FLAG="${2:-}"

if [ ! -d .git ]; then
  echo "Error: current directory is not a git repository (missing .git). Run this inside a clone of the remote repo." >&2
  exit 1
fi

if [ ! -d "$NEW_DIR" ]; then
  echo "Error: new code directory '$NEW_DIR' not found." >&2
  exit 1
fi

timestamp=$(date +%Y%m%d%H%M%S)
backup_branch="backup-before-replace-$timestamp"

echo "Creating backup branch '$backup_branch' of current repo state..."
git checkout -b "$backup_branch"
git add -A || true
git commit -m "Backup before replace: $timestamp" || true
git push -u origin "$backup_branch" || echo "Warning: push to origin failed — continue locally."

echo "Switching back to default branch (trying 'main', then 'master')..."
if git rev-parse --verify main >/dev/null 2>&1; then
  git checkout main
elif git rev-parse --verify master >/dev/null 2>&1; then
  git checkout master
else
  echo "No 'main' or 'master' branch found; continuing on current branch." 
fi

echo "Removing repository files (preserving .git)..."
shopt_dotglob_available=0
if (shopt 2>/dev/null | grep -q dotglob); then
  shopt -s dotglob || true
  shopt_dotglob_available=1
fi

# Remove all items in repo root except .git
for f in ./* ./.??*; do
  case "$f" in
    ./.) ;;
    ./.git) ;;
    ./. | ./.git) ;;
    *) rm -rf "$f" || true ;;
  esac
done

if [ "$shopt_dotglob_available" -eq 1 ]; then
  shopt -u dotglob || true
fi

echo "Copying new code from '$NEW_DIR' into repo root..."
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='.git' --delete "$NEW_DIR"/ ./
else
  cp -a "$NEW_DIR"/. ./
fi

echo "Staging and committing replacement..."
git add -A
git commit -m "Replace repository contents with '$NEW_DIR' (timestamp: $timestamp)" || true

if [ "$PUSH_FLAG" = "--push" ]; then
  echo "Pushing replacement to origin (force)..."
  git push origin HEAD --force
  echo "Push complete. Remote repo now updated (force push used)."
else
  echo "Replacement committed locally. To push to remote, run:" 
  echo "  git push origin HEAD --force"
  echo "If you prefer, re-run this script with the --push flag to automatically push."
fi

echo "Done. Backup branch: $backup_branch"
