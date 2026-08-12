#!/usr/bin/env bash
# Track C 03 assets. vapor-bed.mp4 is the shared Track C opener — the same clip
# backs every episode in this track; only the overlay text changes. That
# repetition is deliberate: it makes a Track C post recognisable on sight.
set -euo pipefail
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"; mkdir -p assets
echo "  → vapor-bed.mp4"
curl -fsSL --retry 3 -o assets/vapor-bed.mp4 \
  "$CDN/hf_20260811_175006_9fe16b4c-1ac1-4579-a82b-de99140bbf5e.mp4"
echo
echo "Done. Now run:"
echo "  node render.js            # cards → out/slide-02..05.png"
echo "  node build-video-slide.js # opener → out/slide-01-video.mp4"
