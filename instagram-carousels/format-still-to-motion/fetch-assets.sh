#!/usr/bin/env bash
# Pulls the sample animated clip (Episode 01 twilight exterior, held frame).
# Swap the URL, or just drop your own clip at assets/motion.mp4.
set -euo pipefail
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"; mkdir -p assets

MOTION=""   # filled in once the sample render completes

if [ -n "$MOTION" ]; then
  echo "  → motion.mp4"
  curl -fsSL --retry 3 -o assets/motion.mp4 "$CDN/$MOTION"
  echo; echo "Done. Now run:  node build-comparison.js"
else
  echo "No sample URL wired yet."
  echo "Drop any animated clip at assets/motion.mp4, then run:"
  echo "  node build-comparison.js"
fi
