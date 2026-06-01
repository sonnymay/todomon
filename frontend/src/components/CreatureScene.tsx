import { useEffect, useState, type ReactNode } from 'react'
import type { Creature } from '../types'
import { creatureSceneVideo, creatureSleepImage } from '../lib/stages'

interface Props {
  creature: Creature
  night: boolean
  justLeveledTo: string | null
  celebration: string | null
  topBar: ReactNode
}

// Stage media are full-scene assets. Idle uses looping MP4; sleep uses a static
// PNG when present, with the idle video still available as fallback.
const SCENE_HEIGHT = 380

export default function CreatureScene({
  creature,
  night,
  justLeveledTo,
  celebration,
  topBar,
}: Props) {
  const sceneVideo = creatureSceneVideo(creature.stage)
  const sleepImage = creatureSleepImage(creature.stage)
  const [sleepImageFailed, setSleepImageFailed] = useState(false)

  useEffect(() => {
    setSleepImageFailed(false)
  }, [sleepImage])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: SCENE_HEIGHT,
        overflow: 'hidden',
        backgroundColor: '#fff7ed',
      }}
    >
      <video
        key={creature.stage}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src={sceneVideo} type="video/mp4" />
      </video>

      {night && !sleepImageFailed && (
        <img
          src={sleepImage}
          alt=""
          onError={() => setSleepImageFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        />
      )}

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
