#!/usr/bin/env bash
# Wenest blog — apply the latest config updates LIVE (run once, by hand).
# Does three things:
#   1. Merges the electrician cover-image fix (branch fix/electrician-cover-image) into main.
#   2. Commits + pushes the new config: beauty/haircut/massage enabled (framed as a
#      service, not wellness) + schedule changed to Mon/Wed/Fri.
#   3. Reloads the launchd cron so the new Mon/Wed/Fri schedule takes effect.
#
# Usage:  bash "/Users/cristianvwz/BusinessAI/WeNest/wenest-blog/scripts/apply-updates.sh"
set -uo pipefail

BLOG="/Users/cristianvwz/BusinessAI/WeNest/wenest-blog"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$BLOG" || { echo "No encuentro $BLOG"; exit 1; }

echo "1/4 · Actualizando main…"
git checkout main || { echo "✗ git checkout main falló"; exit 1; }
git pull --ff-only || { echo "✗ git pull falló"; exit 1; }

echo "2/4 · Integrando el arreglo de portada del electricista…"
git fetch origin fix/electrician-cover-image -q 2>/dev/null || true
if git merge --no-edit origin/fix/electrician-cover-image; then
  echo "  ✓ portada del electricista integrada"
else
  echo "✗ El merge dio conflicto. Pásame el mensaje y lo resolvemos (no sigas)."; exit 1
fi

echo "3/4 · Guardando cambios (belleza/peluquería/masaje + 3 días/semana)…"
git add scripts/auto-blog.config.ts scripts/auto-publish.ts scripts/com.wenest.blog.plist \
        scripts/README-auto-publish.md scripts/go-live.sh scripts/apply-updates.sh
git commit -m "feat(blog): cover beauty/haircut/massage (service-framed) + publish Mon/Wed/Fri

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" \
  || echo "  (nada nuevo que commitear)"
git push origin main || { echo "✗ git push falló — ¿credenciales de GitHub?"; exit 1; }

echo "4/4 · Recargando el cron con el nuevo horario (lun/mié/vie, 10:00)…"
cp scripts/com.wenest.blog.plist ~/Library/LaunchAgents/ || { echo "✗ cp del plist falló"; exit 1; }
launchctl unload ~/Library/LaunchAgents/com.wenest.blog.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.wenest.blog.plist || { echo "✗ launchctl load falló"; exit 1; }

echo ""
echo "✅ LISTO."
echo "   · Belleza, peluquería y masaje ACTIVADOS (escritos como servicio a domicilio, sin consejos de salud)."
echo "   · El blog ahora publica lunes, miércoles y viernes a las 10:00."
echo "   · El arreglo de portada del electricista quedó integrado en main."
echo "   · Si quieres, puedes borrar ya la rama: git push origin --delete fix/electrician-cover-image"
