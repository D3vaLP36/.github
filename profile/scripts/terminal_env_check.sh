#!/usr/bin/env bash
set -euo pipefail

echo "[MusicShortsPro] Terminal environment check"

echo "- node: $(command -v node >/dev/null 2>&1 && node -v || echo 'missing')"
echo "- npm:  $(command -v npm  >/dev/null 2>&1 && npm -v  || echo 'missing')"

echo
echo "Required browser runtime globals:"
echo "  window.__firebase_config   (JSON string)"
echo "  window.__app_id            (optional)"
echo "  window.__initial_auth_token(optional)"
echo "  window.__museshorts_runtime(optional: highSpeedMode, requireCustomToken, handshakeDelayMs)"

echo
echo "Recommended high-speed runtime payload:"
cat <<'JSON'
{"highSpeedMode":true,"requireCustomToken":true,"handshakeDelayMs":450}
JSON
