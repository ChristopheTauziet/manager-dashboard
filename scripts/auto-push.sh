#!/bin/bash

REPO_DIR="/Users/ctauziet/Library/CloudStorage/Dropbox/Sites/Manager dashboard"
LOG_FILE="$REPO_DIR/scripts/auto-push.log"
MAX_LOG_LINES=500

export PATH="/Users/ctauziet/.nvm/versions/node/v20.10.0/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd "$REPO_DIR" || { log "ERROR: Could not cd to repo"; exit 1; }

if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  log "No changes detected"
  exit 0
fi

CHANGED=$(git status --porcelain)
log "Changes detected: $CHANGED"

git add -A
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M')"

if [ $? -eq 0 ]; then
  git push origin main
  if [ $? -eq 0 ]; then
    log "Successfully pushed changes"
  else
    log "ERROR: git push failed"
    exit 1
  fi
else
  log "ERROR: git commit failed"
  exit 1
fi

# Trim log file if it gets too long
if [ -f "$LOG_FILE" ]; then
  tail -n $MAX_LOG_LINES "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
