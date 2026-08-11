#!/usr/bin/env bash
# Trailer 01 assets: the upscaled trailer (carousel position 1) and the three
# reference stills used on slide 02.
set -euo pipefail
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
MEDIA="https://d2ol7oe51mr4n9.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"; mkdir -p assets
get () { echo "  → $2"; curl -fsSL --retry 3 -o "assets/$2" "$1"; }

echo "Fetching Trailer 01 assets…"
get "$CDN/hf_20260811_160829_6371090c-cd11-4d7f-b11d-69ade9a87c9e.png" "ref-man.png"
get "$CDN/hf_20260811_160833_a00d8ac1-785c-4ddb-a1c9-90be018c569c.png" "ref-car.png"
get "$MEDIA/6aba65bf-58fd-4658-a45a-56ac7f53f3a3.jpg"                  "ref-house.png"

# 720p master — always available. The 1080p Topaz upscale is TRAILER_1080 below.
get "$CDN/hf_20260811_161827_da16f0ca-2737-481c-aebc-65668f641599.mp4" "trailer-720.mp4"

TRAILER_1080="hf_20260811_163109_3944a91d-04f3-42fd-a07e-c2bead0c7208.mp4"
if [ -n "$TRAILER_1080" ]; then
  get "$CDN/$TRAILER_1080" "trailer-1080.mp4"
else
  echo "  ! trailer-1080.mp4 not wired yet — use trailer-720.mp4 or grab the upscale from your library"
fi

echo; echo "Done. Now run:  node render.js"
