#!/usr/bin/env bash
# Re-encode creature .mp4 clips to transparent-background .webm (VP9 + alpha).
#
# Source structure (discovered via cropdetect + pixel sampling):
#   egg / hatchling / rookie : 544x544, dragon on WHITE background.
#   champion / ultimate / mega : 720x1280 = a 720x720 dragon-on-WHITE square
#       with BLACK letterbox bars padded top & bottom (280px each, offset y=280).
#
# So every clip is really a square dragon on WHITE. For the portrait ones we first
# CROP away the black bars (720x720 @ y=280), then key the white to transparency.
# Result: uniform square transparent dragons that composite onto the game scene.
#
# The .mp4 originals are LEFT IN PLACE as a fallback <source>. This writes new
# .webm files beside them.
#
# colorkey=COLOR:similarity:blend — tight similarity so the dragon's own light
# highlights survive; blend stays at 0 so the creature itself stays fully opaque.
#
# Usage:  bash scripts/encode-creatures.sh
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/assets/creatures"
cd "$DIR"

KEY="0xFFFFFF"
SIM="0.14"
BLEND="0"

# stage:extra_vf   (crop for the letterboxed portrait clips; empty for squares)
JOBS=(
  "egg:"
  "hatchling:"
  "rookie:"
  "champion:crop=720:720:0:280,"
  "ultimate:crop=720:720:0:280,"
  "mega:crop=720:720:0:280,"
)

for job in "${JOBS[@]}"; do
  stage="${job%%:*}"
  extra="${job#*:}"
  src="$stage.mp4"
  out="$stage.webm"
  if [ ! -f "$src" ]; then
    echo "skip $src (missing)"
    continue
  fi
  echo "encoding $src -> $out (${extra}colorkey=$KEY:$SIM:$BLEND)"
  ffmpeg -hide_banner -loglevel error -y -i "$src" \
    -vf "${extra}colorkey=${KEY}:${SIM}:${BLEND},format=yuva420p" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -an \
    "$out"
done

echo "done."
