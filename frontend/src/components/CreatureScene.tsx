import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Creature } from '../types'
import {
  creatureHungryVideo,
  creatureSceneVideo,
  creatureSleepImage,
} from '../lib/stages'
import * as sfx from '../lib/sfx'
import * as haptics from '../lib/haptics'

interface Props {
  creature: Creature
  night: boolean
  hunger: number
  justLeveledTo: string | null
  celebration: string | null
  greeting: string | null
  aura: string | null // CSS color for the glow behind the pet
  frame: string | null // CSS border for the scene frame
  feedSignal: number // changes to trigger a happy feed reaction
  topBar: ReactNode
  onToggleNight: () => void
}

// Stage media are full-scene assets. Idle uses looping MP4; sleep uses a static
// PNG when present, with the idle video still available as fallback. The pet is the
// star — keep the scene tall so it dominates the screen.
// Responsive scene height — clamped so content below stays readable on every device.
const SCENE_HEIGHT = typeof window !== 'undefined'
  ? Math.min(400, Math.max(280, Math.round(window.innerHeight * 0.37)))
  : 380
const HUNGRY_THRESHOLD = 20

export default function CreatureScene({
  creature,
  night,
  hunger,
  justLeveledTo,
  celebration,
  greeting,
  aura,
  frame,
  feedSignal,
  topBar,
  onToggleNight,
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
  const showHungry =
    !night && hunger < HUNGRY_THRESHOLD && hungryVideo && !hungryVideoFailed

  // Tap-the-pet delight: a little bounce + a floating heart (awake only).
  const [hearts, setHearts] = useState<number[]>([])
  const [bounce, setBounce] = useState(false)
  const [feeding, setFeeding] = useState(false)
  const heartId = useRef(0)

  // Happy reaction when fed (feedSignal increments on each feed).
  useEffect(() => {
    if (feedSignal <= 0) return
    setFeeding(true)
    const id = heartId.current++
    setHearts((h) => [...h, id])
    const t1 = setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 900)
    const t2 = setTimeout(() => setFeeding(false), 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [feedSignal])

  function petTheDragon() {
    if (night) return // it's sleeping 😴
    const id = heartId.current++
    setHearts((h) => [...h, id])
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 900)
    setBounce(true)
    setTimeout(() => setBounce(false), 320)
    sfx.playTap()
    haptics.tapLight()
  }

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
      {/* equipped aura — a colored vignette glow that frames the pet without hiding it */}
      {aura && !night && (
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: `radial-gradient(circle at 50% 55%, transparent 38%, ${aura} 100%)`,
          }}
        />
      )}

      {/* pet media (bounces when tapped) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          transform: bounce ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform 300ms ease-out',
        }}
      >
        {/* Inner wrapper carries the hungry pulse so it composes with the outer
            bounce transform (inline transform on the parent would override an
            animation set on the same element). */}
        <div
          className={
            [feeding ? 'feed-bounce' : '', showHungry ? 'hungry-pulse' : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          style={{ position: 'absolute', inset: 0 }}
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
        </div>
      </div>

      {/* tap layer — pet the dragon (below the top bar, above the video) */}
      {!night && (
        <button
          type="button"
          aria-label="Pet your dragon"
          onClick={petTheDragon}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      )}

      {/* floating hearts */}
      {hearts.map((id) => (
        <span
          key={id}
          className="heart-float pointer-events-none"
          style={{ position: 'absolute', left: '50%', bottom: '34%', zIndex: 25, fontSize: 30 }}
        >
          ❤️
        </span>
      ))}

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

      {/* sleep / wake — upper-right, below the menu button */}
      <button
        onClick={onToggleNight}
        aria-label={night ? 'Wake (switch to day)' : 'Sleep (switch to night)'}
        className="absolute right-3 top-16 z-30 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white transition hover:bg-indigo-700 active:scale-95"
      >
        <span className="text-lg leading-none">{night ? '☀️' : '🌙'}</span>
        <span className="text-[8px] font-bold leading-none">
          {night ? 'WAKE' : 'SLEEP'}
        </span>
      </button>

      {/* welcome-back greeting — shown once when returning on a new day */}
      {greeting && !celebration && (
        <div
          className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md backdrop-blur"
          style={{ position: 'absolute', left: '50%', top: 80, transform: 'translateX(-50%)', zIndex: 20, maxWidth: 260 }}
        >
          <span className="text-xl">💛</span>
          <p className="text-sm font-extrabold leading-tight text-slate-900">{greeting}</p>
        </div>
      )}

      {/* speech bubble — only after a real task completion (not on load) */}
      {celebration && (
        <div
          className="inline-flex items-start gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-md backdrop-blur"
          style={{ position: 'absolute', left: 12, top: 86, zIndex: 20, maxWidth: 250 }}
        >
          <span className="text-xl">⭐</span>
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight text-slate-900">
              {celebration}
            </p>
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

      {/* equipped frame — a decorative border around the whole scene */}
      {frame && (
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 35,
            border: frame,
            borderRadius: 'inherit',
          }}
        />
      )}
    </div>
  )
}
