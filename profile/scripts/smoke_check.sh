#!/usr/bin/env bash
set -euo pipefail

echo "[MusicShortsPro] smoke check"

required_files=(
  "profile/MusicShortsProApp.jsx"
  "profile/READY_FOR_USE.md"
  "profile/NEXT_STEPS.md"
  "profile/PAYMENT_SYSTEM.md"
  "profile/FIRESTORE_RULES.example"
  "profile/scripts/terminal_env_check.sh"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || { echo "missing: $file"; exit 1; }
  echo "ok: $file"
done

grep -q "handlePurchase" profile/MusicShortsProApp.jsx
grep -q "Save Screenshot" profile/MusicShortsProApp.jsx
grep -q "paymentsApiBase" profile/MusicShortsProApp.jsx

echo "ok: required symbols found"
