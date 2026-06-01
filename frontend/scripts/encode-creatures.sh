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
# Transparency is made with a border flood-fill key, not ffmpeg colorkey. That
# removes only white background connected to the frame edge, so internal white
# details (eyes, claws, chest highlights) stay opaque instead of becoming holes.
#
# Usage:  bash scripts/encode-creatures.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIR="$(cd "$SCRIPT_DIR/.." && pwd)/public/assets/creatures"
cd "$DIR"

THRESHOLD="195"
KEY_SCRIPT="$SCRIPT_DIR/key-creature-background.mjs"

# stage|extra_vf|size   (crop for the letterboxed portrait clips; empty for squares)
JOBS=(
  "egg||544"
  "hatchling||544"
  "rookie||544"
  "champion|crop=720:720:0:280,|720"
  "ultimate|crop=720:720:0:280,|720"
  "mega|crop=720:720:0:280,|720"
)

for job in "${JOBS[@]}"; do
  IFS="|" read -r stage extra size <<< "$job"
  src="$stage.mp4"
  out="$stage.webm"
  if [ ! -f "$src" ]; then
    echo "skip $src (missing)"
    continue
  fi
  fps="$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=nw=1:nk=1 "$src")"
  echo "encoding $src -> $out (${extra}border flood-fill threshold=$THRESHOLD)"
  ffmpeg -hide_banner -loglevel error -i "$src" \
    -vf "${extra}format=rgba" \
    -f rawvideo -pix_fmt rgba - \
    | node "$KEY_SCRIPT" "$size" "$size" "$THRESHOLD" \
    | ffmpeg -hide_banner -loglevel error -y \
      -f rawvideo -pix_fmt rgba -s "${size}x${size}" -r "$fps" -i - \
      -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 -an \
      "$out"
done

echo "done."
