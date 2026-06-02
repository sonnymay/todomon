// Generates the app icon + splash as PNGs using only Node built-ins (zlib) — no native deps.
// A cute golden dragon-egg on a warm sunny gradient (icon) / cream background (splash).
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type 2 = RGB (no alpha; required for iOS app icon)
  const stride = w * 3
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
const lerp = (a, b, t) => a + (b - a) * t
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]

function draw(S, eggScale, cream) {
  const rgb = Buffer.alloc(S * S * 3)
  const cx = S / 2,
    cy = S * 0.54
  const rx = S * 0.2 * eggScale,
    ry = S * 0.26 * eggScale
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let col
      if (cream) {
        col = [253, 246, 227]
      } else {
        const dx = x - S / 2,
          dy = y - S * 0.42
        const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (S * 0.78))
        col = t < 0.45 ? mix([255, 233, 168], [252, 173, 60], t / 0.45) : mix([252, 173, 60], [244, 121, 31], (t - 0.45) / 0.55)
      }
      // egg body
      const u = (x - cx) / rx,
        v = (y - cy) / ry
      const d = u * u + v * v
      const eggA = 1 - smooth(0.97, 1.03, d)
      if (eggA > 0) {
        const tv = Math.min(1, Math.max(0, (y - (cy - ry)) / (2 * ry)))
        let egg = mix([255, 250, 244], [253, 224, 138], tv)
        // soft top-left highlight
        const hx = (x - (cx - rx * 0.34)) / (rx * 0.5),
          hy = (y - (cy - ry * 0.46)) / (ry * 0.4)
        egg = mix(egg, [255, 255, 255], (1 - smooth(0, 1, hx * hx + hy * hy)) * 0.5)
        col = mix(col, egg, eggA)
        // cute face
        const eye = (ex) => {
          const ddx = x - (cx + ex),
            ddy = y - (cy - ry * 0.04)
          return ddx * ddx + ddy * ddy < (rx * 0.075) ** 2
        }
        if (eye(-rx * 0.34) || eye(rx * 0.34)) col = mix(col, [70, 48, 35], 0.92 * eggA)
        // smile: lower ring band
        const sdx = (x - cx) / (rx * 0.36),
          sdy = (y - (cy + ry * 0.2)) / (ry * 0.2)
        const sd = sdx * sdx + sdy * sdy
        if (sd > 0.55 && sd < 1.0 && y > cy + ry * 0.2) col = mix(col, [70, 48, 35], 0.85 * eggA)
      }
      const o = (y * S + x) * 3
      rgb[o] = Math.round(col[0])
      rgb[o + 1] = Math.round(col[1])
      rgb[o + 2] = Math.round(col[2])
    }
  }
  return rgb
}

function write(file, w, h, rgb) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, encodePNG(w, h, rgb))
  console.log('wrote', file)
}

const root = path.resolve(__dirname, '..')
// App icon (1024, sunny gradient)
const icon = draw(1024, 1, false)
write(path.join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), 1024, 1024, icon)
write(path.join(root, 'frontend/public/icon-1024.png'), 1024, 1024, icon)
// Splash (2732, cream bg, larger egg)
const splash = draw(2732, 1.15, true)
;['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'].forEach((f) =>
  write(path.join(root, 'ios/App/App/Assets.xcassets/Splash.imageset/' + f), 2732, 2732, splash),
)
console.log('done')
