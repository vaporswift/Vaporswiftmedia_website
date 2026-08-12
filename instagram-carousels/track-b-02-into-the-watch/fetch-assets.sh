#!/usr/bin/env bash
# Track B 02 assets. alt-* are the real-estate episode's frames, used on slide 6.
set -euo pipefail
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"; mkdir -p assets
get () { echo "  → $2"; curl -fsSL --retry 3 -o "assets/$2" "$CDN/$1"; }
echo "Fetching Track B 02 assets…"
get "hf_20260810_051610_2d9dc8b9-98a2-4f55-86c1-080a40d15ef7.png" "start.png"
get "hf_20260810_051614_8c4760b2-d57f-4b24-b7c4-271544097a9c.png" "end.png"
get "hf_20260810_051700_04b995e1-faa9-4703-ad41-3bb1f44ff006.png" "alt-start.png"
get "hf_20260810_051603_a2ef5048-91d7-42f5-a4b4-e903a3569409.png" "alt-end.png"
get "hf_20260810_051752_a63a0543-33cd-4480-989a-e34c796d2e6a.mp4" "reel.mp4"
echo; echo "Done. Now run:  node render.js"
