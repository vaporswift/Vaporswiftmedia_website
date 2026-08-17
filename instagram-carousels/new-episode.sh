#!/usr/bin/env bash
#
# Scaffold a new episode folder from the shipped pipeline.
#
#   ./new-episode.sh track-c-04-my-topic C04
#
# Copies the renderer, the caption checker, the vendored fonts and the build
# files from an existing episode, then writes stub content with the episode
# code already threaded through. Nothing here is novel — it exists so that
# starting an episode costs zero decisions and zero tokens.
#
# What it deliberately does NOT do: write slides. Read PRODUCTION.md, start
# from the known-good geometry table, and write the caption before the deck.
set -euo pipefail

SLUG="${1:-}"
CODE="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$HERE/track-c-03-claude-vs-chatgpt"   # newest pipeline; carries every assertion

if [[ -z "$SLUG" || -z "$CODE" ]]; then
  echo "usage: ./new-episode.sh <slug> <CODE>"
  echo "   eg: ./new-episode.sh track-c-04-audit-prompt C04"
  exit 1
fi

DEST="$HERE/$SLUG"
if [[ -e "$DEST" ]]; then
  echo "✗ $SLUG already exists — pick another slug or delete it first."
  exit 1
fi

echo "Scaffolding $SLUG ($CODE) from $(basename "$SOURCE")"
mkdir -p "$DEST/assets" "$DEST/out" "$DEST/fonts"

# The pipeline. All four carry assertions — copy them verbatim, don't rewrite.
cp "$SOURCE/render.js"            "$DEST/render.js"
cp "$SOURCE/check-caption.js"     "$DEST/check-caption.js"
cp "$SOURCE/build-video-slide.js" "$DEST/build-video-slide.js"
cp "$SOURCE/.gitignore"           "$DEST/.gitignore"
cp "$SOURCE"/fonts/*.ttf          "$DEST/fonts/"

# package.json, renamed to this episode.
sed -e "s/vaporswift-track-c-03/vaporswift-$(echo "$CODE" | tr '[:upper:]' '[:lower:]')/" \
    -e "s/Track C 03: Claude vs ChatGPT/$CODE: TODO/" \
    "$SOURCE/package.json" > "$DEST/package.json"

# The shared Track C opener. Every C episode reuses this one clip — only the
# overlay text changes. Regenerating it would be a wasted Higgsfield pass.
cp "$SOURCE/fetch-assets.sh" "$DEST/fetch-assets.sh"
sed -i.bak "s/Track C 03 assets/$CODE assets/" "$DEST/fetch-assets.sh" && rm -f "$DEST/fetch-assets.sh.bak"
chmod +x "$DEST/fetch-assets.sh"

# The video overlay, with the episode badge already set.
sed -e "s|<div class=\"ep\">C03</div>|<div class=\"ep\">$CODE</div>|" \
    -e "s|Track C 03 — video overlay|$CODE — video overlay|" \
    "$SOURCE/overlay.html" > "$DEST/overlay.html"

cat > "$DEST/meta.json" <<JSON
{
  "code": "$CODE",
  "track": "${CODE:0:1}",
  "trackName": "TODO",
  "shortTitle": "TODO",
  "title": "TODO — phrase this as a question someone would actually type",
  "description": "TODO — one sentence, used as the page meta description",
  "format": "video-carousel",
  "published": null,
  "instagramUrl": null,
  "faq": [
    { "q": "TODO", "a": "TODO — a complete answer, quotable on its own" },
    { "q": "TODO", "a": "TODO" }
  ]
}
JSON

cat > "$DEST/caption.md" <<'MD'
# TODO — Caption

Carousel: vapor bed + floating text is position 1, then N cards.

First line is TODO characters — `node check-caption.js` measures it and fails
if this number drifts.

---

TODO — the hook. One sentence, under 125 characters, that lands the whole
claim and creates a gap. Instagram cuts mid-word, so it has to be complete.

Here's how.

TODO — the article. Write this before the slides; the slides are the trailer
for it. Include the full prompt as plain text, because image text isn't
selectable and a copyable prompt is the biggest save driver in this format.

Save this for TODO.

Send it to someone who TODO.

#todo #todo
MD

cat > "$DEST/slides.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vaporswift — TODO</title>
<style>
  /* Start from the geometry table in PRODUCTION.md — those numbers shipped.
     Copy the token block and the masters you need from an existing deck
     rather than reinventing spacing; iterating on layout visually is the
     most expensive way to build one of these. */
</style>
</head>
<body>
  <!-- Slide 2 is the second-serve cover: Instagram may resurface the post
       using it instead of slide 1, so it has to hook with nothing in front
       of it. Slides start at 02 because position 1 is the video. -->
</body>
</html>
HTML

echo
echo "✓ $SLUG scaffolded."
echo
echo "  1. read ../PRODUCTION.md          — sequence, geometry, credit rules"
echo "  2. write caption.md first         — then: node check-caption.js"
echo "  3. fill meta.json                 — question-shaped title, 2 FAQ pairs"
echo "  4. build slides.html              — from the known-good geometry"
echo "  5. npm install && ./fetch-assets.sh"
echo "  6. node render.js && node build-video-slide.js"
echo "  7. node ../content/build-content.js"
echo
