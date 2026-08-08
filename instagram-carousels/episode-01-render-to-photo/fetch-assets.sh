#!/usr/bin/env bash
# Pulls the Episode 01 source images from Higgsfield into ./assets, then renders
# all 8 slides.
#
#   ./fetch-assets.sh && node render.js
#
# Run this on your own machine — the sandbox that generated these can't reach
# the Higgsfield CDN.
set -euo pipefail

CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3Cx6lxAMIv3Bm4poL4fw1eFKLFy"
cd "$(dirname "$0")"
mkdir -p assets

get () { # get <url-basename> <local-name>
  echo "  → $2"
  curl -fsSL --retry 3 -o "assets/$2" "$CDN/$1"
}

echo "Fetching Episode 01 assets…"
get "hf_20260807_030734_cbdaf7d3-c750-41df-884d-ee8e7c7c0e53.png" "before.png"
get "hf_20260807_031117_c9ddce63-db50-4c16-9737-fbfc1fb96c74.png" "after.png"
get "hf_20260807_031117_c9ddce63-db50-4c16-9737-fbfc1fb96c74.png" "lever-twilight.png"
get "hf_20260807_031413_298eb3a5-bbe5-4b9b-8fe8-7911c490c1d3.png" "lever-golden.png"
get "hf_20260807_031419_e391c857-e62b-4472-a317-10d755891405.png" "lever-overcast.png"

echo
echo "Done. Now run:  node render.js"
