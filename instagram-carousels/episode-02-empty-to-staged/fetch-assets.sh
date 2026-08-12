#!/usr/bin/env bash
# Pulls the Episode 02 source images from Higgsfield into ./assets.
#
#   ./fetch-assets.sh && node render.js
set -euo pipefail

CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"
mkdir -p assets

get () { echo "  → $2"; curl -fsSL --retry 3 -o "assets/$2" "$CDN/$1"; }

echo "Fetching Episode 02 assets…"
get "hf_20260810_012620_1d31c8bb-4442-4934-9c21-ad74503fa170.png" "before.png"
get "hf_20260810_012719_31da8fbe-e00a-4184-9003-957065562280.png" "after.png"
get "hf_20260810_012719_31da8fbe-e00a-4184-9003-957065562280.png" "lever-minimal.png"
get "hf_20260810_012725_aac530cc-5955-4875-ac66-19d9fb96ea4c.png" "lever-midcentury.png"
get "hf_20260810_012731_bc6ca31d-7f8d-4d2a-b907-9cce9c549492.png" "lever-family.png"

echo
echo "Done. Now run:  node render.js"
