import { useEffect, useState, type ReactNode } from 'react'
import type { Creature } from '../types'
import {
  creatureHungryVideo,
  creatureSceneVideo,
  creatureSleepImage,
} from '../lib/stages'

interface Props {
  creature: Creature
  night: boolean
  hunger: number
  justLeveledTo: string | null
  celebration: string | null
  topBar: ReactNode
}

// Stage media are full-scene assets. Idle uses looping MP4; sleep uses a static
// PNG when present, with the idle video still available as fallback.
const SCENE_HEIGHT = 440
const HUNGRY_THRESHOLD = 20

export default function CreatureScene({
  creature,
  night,
  hunger,
  justLeveledTo,
  celebration,
  topBar,
}: Props) {
  const sceneVideo = creatureSceneVideo(creature.stage)
  const sleepImage = creatureSleepImage(creature.stage)
  const hungryVideo = creatureHungryVideo(creature.stage)
  const [sleepImageFailed, setSleepImageFailed] = useState(false)
  const [hungryVideoFailed, setHungryVideoFailed] = useState(false)

  useEffect(() => {
    setSleepImageFailed(false)
  }, [sleepImage])

  useEffect(() => {
    setHungryVideoFailed(false)
  }, [hungryVideo])

  // Very-hungry state shows a distinct video — but only while awake (sleep wins at
  // night). Falls back to the normal scene if the hungry asset isn't present yet.
  const showHungry = !night && hunger < HUNGRY_THRESHOLD && !hungryVideoFailed

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

      {showHungry && (
        <video
          key={`hungry-${creature.stage}`}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHungryVideoFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        >
          <source src={hungryVideo} type="video/mp4" />
        </video>
      )}

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
