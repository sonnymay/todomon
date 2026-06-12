import { Share } from '@capacitor/share'
import { Directory, Filesystem } from '@capacitor/filesystem'

// Share-your-dragon: render a postcard (current dragon video frame + name/stage/streak)
// and hand it to the native share sheet. The card is the growth loop — people show off
// their pet, the card carries the App Store link.

export const APP_STORE_URL = 'https://apps.apple.com/app/id6776013029'

// Pure: the text that accompanies the card (and the whole share on web fallback).
export function buildShareText(name: string, stageLabel: string, streak: number): string {
  const streakBit = streak > 0 ? ` We're on a ${streak}-day streak of real tasks!` : ''
  return `Meet ${name}, my ${stageLabel} dragon on ToDoMon! 🐉${streakBit} Finish to-dos, feed your dragon: ${APP_STORE_URL}`
}

// Draw the share card: dragon scene on top, cream caption panel below.
export function drawShareCard(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  name: string,
  stageLabel: string,
  streak: number,
): void {
  const W = 1080
  const H = 1350
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas context')

  // Dragon scene — cover-fit the current video frame into the top section.
  const sceneH = 1010
  ctx.fillStyle = '#fdf6e3'
  ctx.fillRect(0, 0, W, H)
  const vw = video.videoWidth || 16
  const vh = video.videoHeight || 9
  const scale = Math.max(W / vw, sceneH / vh)
  const dw = vw * scale
  const dh = vh * scale
  ctx.drawImage(video, (W - dw) / 2, (sceneH - dh) / 2, dw, dh)

  // Caption panel.
  ctx.fillStyle = '#fdf6e3'
  ctx.fillRect(0, sceneH, W, H - sceneH)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#1e293b'
  ctx.font = '900 64px -apple-system, "Segoe UI", sans-serif'
  ctx.fillText(`${name} the ${stageLabel} 🐉`, W / 2, sceneH + 105)
  ctx.font = '800 44px -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = '#ea580c'
  ctx.fillText(
    streak > 0 ? `🔥 ${streak}-day task streak` : 'Raised by finishing real to-dos',
    W / 2,
    sceneH + 185,
  )
  ctx.font = '700 36px -apple-system, "Segoe UI", sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText('ToDoMon — get things done, watch it grow', W / 2, sceneH + 265)
}

export async function shareDragon(
  video: HTMLVideoElement | null,
  name: string,
  stageLabel: string,
  streak: number,
): Promise<void> {
  const text = buildShareText(name, stageLabel, streak)
  try {
    if (video) {
      const canvas = document.createElement('canvas')
      drawShareCard(canvas, video, name, stageLabel, streak)
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const file = await Filesystem.writeFile({
        path: 'todomon-share.png',
        data: base64,
        directory: Directory.Cache,
      })
      await Share.share({ text, files: [file.uri] })
      return
    }
  } catch {
    // canvas/filesystem/native share failed — fall through to text-only
  }
  try {
    await Share.share({ text })
  } catch {
    // web dev fallback
    try {
      await navigator.share?.({ text })
    } catch {
      // user cancelled or unsupported — fine
    }
  }
}
