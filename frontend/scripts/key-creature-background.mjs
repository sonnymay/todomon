#!/usr/bin/env node

const [widthArg, heightArg, thresholdArg, modeArg = 'white'] = process.argv.slice(2)
const width = Number(widthArg)
const height = Number(heightArg)
const threshold = Number(thresholdArg)
const mode = modeArg

if (!Number.isInteger(width) || !Number.isInteger(height) || !Number.isInteger(threshold)) {
  console.error('usage: key-creature-background.mjs <width> <height> <threshold> [white|green]')
  process.exit(2)
}
if (mode !== 'white' && mode !== 'green') {
  console.error(`unknown mode "${mode}" (expected white|green)`)
  process.exit(2)
}

// Is pixel i a BACKGROUND pixel to be flood-filled away?
//   white : near-white (all channels >= threshold).
//   green : dominant green (the chroma-green screen). Gold/orange/red creature
//           pixels have red >= green so they never match — only the green screen
//           and its yellow-green anti-aliased fringe key out. Binary alpha, so the
//           creature body stays 100% opaque (no see-through, unlike ffmpeg chromakey).
const isBackground =
  mode === 'green'
    ? (r, g, b) => g >= 80 && g - r >= 30 && g - b >= 25
    : (r, g, b) => r >= threshold && g >= threshold && b >= threshold

const frameSize = width * height * 4
let pending = Buffer.alloc(0)

process.stdin.on('data', (chunk) => {
  pending = Buffer.concat([pending, chunk])
  while (pending.length >= frameSize) {
    const frame = Buffer.from(pending.subarray(0, frameSize))
    pending = pending.subarray(frameSize)
    processFrame(frame)
    process.stdout.write(frame)
  }
})

process.stdin.on('end', () => {
  if (pending.length !== 0) {
    console.error(`trailing partial frame: ${pending.length} bytes`)
    process.exitCode = 1
  }
})

function processFrame(frame) {
  const pixels = width * height
  const seen = new Uint8Array(pixels)
  const queue = new Int32Array(pixels)
  let head = 0
  let tail = 0

  const tryAdd = (x, y) => {
    const p = y * width + x
    if (seen[p]) return
    const i = p * 4
    if (isBackground(frame[i], frame[i + 1], frame[i + 2])) {
      seen[p] = 1
      queue[tail++] = p
    }
  }

  for (let x = 0; x < width; x += 1) {
    tryAdd(x, 0)
    tryAdd(x, height - 1)
  }
  for (let y = 1; y < height - 1; y += 1) {
    tryAdd(0, y)
    tryAdd(width - 1, y)
  }

  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    const y = Math.floor(p / width)
    if (x > 0) tryAdd(x - 1, y)
    if (x < width - 1) tryAdd(x + 1, y)
    if (y > 0) tryAdd(x, y - 1)
    if (y < height - 1) tryAdd(x, y + 1)
  }

  for (let pass = 0; pass < 2; pass += 1) {
    const toRemove = []
    for (let p = 0; p < pixels; p += 1) {
      if (seen[p]) continue
      const x = p % width
      const y = Math.floor(p / width)
      const touchesBg =
        (x > 0 && seen[p - 1]) ||
        (x < width - 1 && seen[p + 1]) ||
        (y > 0 && seen[p - width]) ||
        (y < height - 1 && seen[p + width])
      if (!touchesBg) continue

      const i = p * 4
      const r = frame[i]
      const g = frame[i + 1]
      const b = frame[i + 2]

      if (mode === 'green') {
        // Green screens leave anti-aliased green rim pixels. Gold/orange/red edges
        // have red >= green, so they survive; only green-dominant rim peels away.
        if (g > r && g > b) toRemove.push(p)
      } else {
        // White screens leave anti-aliased light matte pixels. Remove only low-
        // saturation bright pixels touching transparency, so internal white claws,
        // eyes, and highlights remain opaque.
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        if (max >= 170 && max - min <= 70) toRemove.push(p)
      }
    }
    if (toRemove.length === 0) break
    for (const p of toRemove) seen[p] = 1
  }

  for (let p = 0; p < pixels; p += 1) {
    const i = p * 4
    if (seen[p]) {
      frame[i + 3] = 0
      continue
    }
    frame[i + 3] = 255
    // Despill: green can never exceed the larger of red/blue. Leaves gold untouched
    // (red already dominates) but neutralises any lingering green tint on kept edges.
    if (mode === 'green') {
      const cap = frame[i] > frame[i + 2] ? frame[i] : frame[i + 2]
      if (frame[i + 1] > cap) frame[i + 1] = cap
    }
  }
}
