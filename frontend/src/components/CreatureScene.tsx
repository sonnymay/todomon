import type { ReactNode } from 'react'
import type { Creature } from '../types'
import { creatureSources } from '../lib/stages'

interface Props {
  creature: Creature
  night: boolean
  justLeveledTo: string | null
  celebration: string | null
  topBar: ReactNode
}

// The creature videos are now transparent-background .webm (with .mp4 fallback),
// all cropped to square — so they composite directly onto the day/night scene
// with NO mix-blend-mode (which previously ghosted the dragon) and NO black
// letterbox bars. A square box with object-contain means no clipping at any stage.
const SCENE_HEIGHT = 380
const CREATURE_SIZE = 320 // square; matches the square source clips

export default function CreatureScene({
  creature,
  night,
  justLeveledTo,
  celebration,
  topBar,
}: Props) {
  const bg = night
    ? '/assets/backgrounds/night.png'
    : '/assets/backgrounds/day.png'
  const sources = creatureSources(creature.stage)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: SCENE_HEIGHT,
        overflow: 'hidden',
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* top bar overlaid on the scene */}
      <div style={{ position: 'absolute', insetInline: 0, top: 0, zIndex: 20 }}>
        {topBar}
      </div>

      {/* speech bubble — only after a real task completion (not on load) */}
      {celebration && (
        <div
          className="inline-flex items-start gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-md backdrop-blur"
          style={{ position: 'absolute', left: 12, top: 86, zIndex: 20, maxWidth: 240 }}
        >
          <span className="text-xl">⭐</span>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-slate-900">
              Great job!
            </p>
            <p className="text-xs leading-tight text-slate-600">{celebration}</p>
          </div>
        </div>
      )}

      {/* creature — transparent webm, autoplay + loop = continuous animation */}
      <video
        key={creature.stage}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: CREATURE_SIZE,
          width: CREATURE_SIZE,
          objectFit: 'contain',
          zIndex: 10,
        }}
      >
        <source src={sources.webm} type="video/webm" />
        <source src={sources.mp4} type="video/mp4" />
      </video>

      {/* night dims the scene */}
      {night && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            backgroundColor: 'rgba(30,27,75,0.40)',
          }}
        />
      )}

      {justLeveledTo && (
        <div
          className="animate-bounce rounded-full bg-yellow-300 px-4 py-1 text-sm font-bold text-yellow-900 shadow-lg"
          style={{
            position: 'absolute',
            left: '50%',
            top: '33%',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          Evolved to {justLeveledTo}! ✨
        </div>
      )}
    </div>
  )
}
