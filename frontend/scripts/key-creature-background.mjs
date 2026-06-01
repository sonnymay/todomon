#!/usr/bin/env node

const [widthArg, heightArg, thresholdArg] = process.argv.slice(2)
const width = Number(widthArg)
const height = Number(heightArg)
const threshold = Number(thresholdArg)

if (!Number.isInteger(width) || !Number.isInteger(height) || !Number.isInteger(threshold)) {
  console.error('usage: key-creature-background.mjs <width> <height> <threshold>')
  process.exit(2)
}

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
    if (frame[i] >= threshold && frame[i + 1] >= threshold && frame[i + 2] >= threshold) {
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

  for (let p = 0; p < pixels; p += 1) {
    frame[p * 4 + 3] = seen[p] ? 0 : 255
  }
}
