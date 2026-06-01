#!/usr/bin/env bash
# Re-encode creature .mp4 clips to transparent-background .webm (VP9 + alpha).
#
# Two source generations, two keying methods (the `key` field per job):
#
#   key=green  (NEW, preferred) — clips regenerated on a flat GREEN screen, 720x1280
#       portrait with BLACK letterbox bars (cropped to 720x720 @ y=280). Keyed with the
#       SAME border flood-fill as white (green mode), NOT ffmpeg `chromakey`: chromakey
#       keys in YUV by colour distance, and gold = red+green, so it partially keyed the
#       creature's own body and made it semi-transparent (see-through). The flood-fill
#       gives binary alpha and only removes border-connected green, so the body stays
#       100% opaque. This is the fix for the old "see-through + white halo" problem.
#
#   key=white  (LEGACY) — clips baked on a WHITE background. Keyed with a border
#       flood-fill (key-creature-background.mjs) so internal white details (eyes,
#       claws, highlights) stay opaque instead of becoming holes. Used only by stages
#       not yet regenerated on green. Remove a stage's white entry once it's green.
#
# The .mp4 originals are LEFT IN PLACE as a fallback <source>. This writes .webm beside.
#
# Usage:  bash scripts/encode-creatures.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIR="$(cd "$SCRIPT_DIR/.." && pwd)/public/assets/creatures"
cd "$DIR"

THRESHOLD="150"                                  # white flood-fill key threshold
KEY_SCRIPT="$SCRIPT_DIR/key-creature-background.mjs"

# stage|extra_vf|size|grade|key
#   extra_vf : crop for the letterboxed portrait clips; empty for squares.
#   grade    : optional color grade applied AFTER keying (alpha preserved). Was a
#              stopgap for mega's washed-out white-on-white art; drop it once mega is
#              regenerated on green.
#   key      : green | white  (see header).
MEGA_GRADE="eq=brightness=-0.16:contrast=1.30:saturation=1.55,colorbalance=rm=0.10:gm=-0.02:bm=-0.12:rh=0.08:bh=-0.14"
JOBS=(
  "egg||544||white"
  "hatchling||544||white"
  "baby|crop=720:720:0:280,|720||green"
  "rookie|crop=720:720:0:280,|720||green"
  "champion|crop=720:720:0:280,|720||white"
  "ultimate|crop=720:720:0:280,|720||white"
  "mega|crop=720:720:0:280,|720|$MEGA_GRADE|white"
)

for job in "${JOBS[@]}"; do
  IFS="|" read -r stage extra size grade key <<< "$job"
  src="$stage.mp4"
  out="$stage.webm"
  if [ ! -f "$src" ]; then
    echo "skip $src (missing)"
    continue
  fi
  fps="$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=nw=1:nk=1 "$src")"

  echo "encoding $src -> $out ($key flood-fill${grade:+ +grade})"
  if [ -n "$grade" ]; then
    ffmpeg -hide_banner -loglevel error -i "$src" \
      -vf "${extra}format=rgba" \
      -f rawvideo -pix_fmt rgba - \
      | node "$KEY_SCRIPT" "$size" "$size" "$THRESHOLD" "$key" \
      | ffmpeg -hide_banner -loglevel error -y \
        -f rawvideo -pix_fmt rgba -s "${size}x${size}" -r "$fps" -i - \
        -vf "$grade" \
        -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 -an \
        "$out"
  else
    ffmpeg -hide_banner -loglevel error -i "$src" \
      -vf "${extra}format=rgba" \
      -f rawvideo -pix_fmt rgba - \
      | node "$KEY_SCRIPT" "$size" "$size" "$THRESHOLD" "$key" \
      | ffmpeg -hide_banner -loglevel error -y \
        -f rawvideo -pix_fmt rgba -s "${size}x${size}" -r "$fps" -i - \
        -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 -an \
        "$out"
  fi
done

echo "done."
