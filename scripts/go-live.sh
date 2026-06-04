#!/usr/bin/env bash
# Wenest blog — ONE-TIME go-live. Run this once, by hand, to:
#   1. version the auto-publisher tooling on main,
#   2. publish the FIRST article for real (Vercel deploys it, Telegram pings you),
#   3. install the launchd cron so it keeps publishing on its own (Tue + Thu, 10:00).
#
# After this, you never run anything again — the cron is fully automatic.
#
# Usage:  bash "/Users/cristianvwz/BusinessAI/WeNest/wenest-blog/scripts/go-live.sh"
set -uo pipefail

BLOG="/Users/cristianvwz/BusinessAI/WeNest/wenest-blog"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$BLOG" || { echo "No encuentro $BLOG"; exit 1; }

echo "1/4 · Cambiando a main y actualizando…"
git checkout main || { echo "✗ git checkout main falló"; exit 1; }
git pull --ff-only || { echo "✗ git pull falló"; exit 1; }

echo "2/4 · Versionando las herramientas del publicador en main…"
git add scripts/auto-publish.ts scripts/auto-blog.config.ts scripts/run-auto-publish.sh \
        scripts/com.wenest.blog.plist scripts/README-auto-publish.md scripts/go-live.sh \
        .gitignore package.json CLAUDE.md
git commit -m "feat(blog): fully automatic publisher (topic -> article -> publish -> Telegram)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" \
  || echo "  (nada nuevo que commitear — seguramente ya estaba)"
git push origin main || { echo "✗ git push de las herramientas falló — ¿credenciales de GitHub?"; exit 1; }

echo "3/4 · Publicando el PRIMER artículo de verdad (puede tardar ~2 min)…"
bash scripts/run-auto-publish.sh || { echo "✗ La publicación falló — revisa el aviso de Telegram y /tmp/wenest-blog.err"; exit 1; }

echo "4/4 · Instalando el cron (martes y jueves, 10:00)…"
cp scripts/com.wenest.blog.plist ~/Library/LaunchAgents/ || { echo "✗ No pude copiar el plist"; exit 1; }
launchctl unload ~/Library/LaunchAgents/com.wenest.blog.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.wenest.blog.plist || { echo "✗ launchctl load falló"; exit 1; }

echo ""
echo "✅ LISTO. El blog automático está en marcha."
echo "   · Acabas de publicar el primer artículo (mira el Telegram con el enlace)."
echo "   · A partir de ahora se publica SOLO los martes y jueves a las 10:00."
echo "   · Para pararlo: launchctl unload ~/Library/LaunchAgents/com.wenest.blog.plist"
