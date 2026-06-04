#!/usr/bin/env bash
# Wenest blog — scheduled publisher launcher (used by launchd, see com.wenest.blog.plist).
#
# Loads the shared GTM agents/.env (Anthropic + Telegram keys live there), makes sure
# Homebrew's node/npx are on PATH (launchd starts with a minimal PATH), then generates
# and publishes ONE article. The TypeScript orchestrator handles its own Telegram
# notifications; this wrapper only adds a last-resort alert if the run can't even start.
#
# Run by hand (safe, does NOT publish):  bash scripts/run-auto-publish.sh --dry-run
# Run by hand (PUBLISHES for real):       bash scripts/run-auto-publish.sh
# Scheduled:                              see com.wenest.blog.plist (launchd)
set -uo pipefail

BLOG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # .../wenest-blog
AGENTS_ENV="$BLOG/../agents/.env"

# Homebrew node/npx (launchd PATH is bare).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Share the GTM agents' secrets (ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
set -a; . "$AGENTS_ENV" 2>/dev/null; set +a

# Default to --publish when scheduled; pass --dry-run to test by hand.
MODE="${1:---publish}"

cd "$BLOG" || exit 1
npx tsx scripts/auto-publish.ts "$MODE"
CODE=$?

if [ "$CODE" -ne 0 ]; then
  # Last-resort alert in case the orchestrator never got far enough to notify.
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -o /dev/null -X POST \
      "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -H 'content-type: application/json' \
      -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":\"🛑 Blog: el publicador automático no pudo arrancar (exit ${CODE}). Revisa /tmp/wenest-blog.err\"}" || true
  fi
fi

exit "$CODE"
