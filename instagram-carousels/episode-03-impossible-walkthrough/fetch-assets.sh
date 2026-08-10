#!/usr/bin/env bash
# Episode 03 assets. alt-* are the product episode's frames, used on slide 6.
set -euo pipefail
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"; mkdir -p assets
get () { echo "  → $2"; curl -fsSL --retry 3 -o "assets/$2" "$CDN/$1"; }
echo "Fetching Episode 03 assets…"
get "hf_20260810_051700_04b995e1-faa9-4703-ad41-3bb1f44ff006.png" "start.png"
get "hf_20260810_051603_a2ef5048-91d7-42f5-a4b4-e903a3569409.png" "end.png"
get "hf_20260810_051610_2d9dc8b9-98a2-4f55-86c1-080a40d15ef7.png" "alt-start.png"
get "hf_20260810_051614_8c4760b2-d57f-4b24-b7c4-271544097a9c.png" "alt-end.png"
get "hf_20260810_051750_142b62e5-f893-47a4-84cd-91e8d32a9580.mp4" "reel.mp4"

# The 3:4 reframe used as carousel slide 1. If this URL is not yet filled in,
# download the reframed clip from the Higgsfield library and save it as
# assets/reel-3x4.mp4 by hand — build-video-slide.js reads it from there.
REEL_3X4=""
if [ -n "$REEL_3X4" ]; then
  get "$REEL_3X4" "reel-3x4.mp4"
else
  echo "  ! reel-3x4.mp4 not wired yet — save the 3:4 reframe there manually"
fi
echo; echo "Done. Now run:  node render.js"
