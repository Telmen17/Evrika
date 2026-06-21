import {
  type CSSProperties,
  type FC,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react'
import type { SceneId } from './LandingPage'
import { LessonHubProvider, useLessonHub } from '../context/LessonHubContext'
import CrownWeighScene from './CrownWeighScene'
import CrownMeltScene from './CrownMeltScene'
import WaterDiscoveryScene from './WaterDiscoveryScene'
import StoryBathScene from './StoryBathScene'
import DisplacementLabScene from './DisplacementLabScene'
import ArchimedesRoomScene from './ArchimedesRoomScene'
import StoryFinaleScene from './StoryFinaleScene'
import { ArchimedesCompanion } from './ArchimedesCompanion'
import { HubAmbientMusic } from './HubAmbientMusic'
import { HubOnboardingGuide } from './HubOnboardingGuide'
import { EurekaShareCard } from './EurekaShareCard'
import { FeedbackModal } from './FeedbackModal'
import { FeedbackInbox } from './FeedbackInbox'
import papyrusImg from '../assets/papyrus.webp'
import {
  getNavRoomCompletionState,
  getNavRoomUnlockState,
  HUB_GUIDE_FROM_INTRO_KEY,
  OVERFLOW_UNLOCK_INSIGHT,
  roomCompleteHeading,
  roomUnlockHeading,
  shouldTriggerBathCutscene,
  type NavRoomId,
} from '../lib/hubRooms'
import { playSoundEffect, HUB_CHECK_STAMP_DELAY_MS, TADA_EFFECT_SRC } from '../lib/playSoundEffect'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'

type RoomId = NavRoomId

interface RoomDef {
  id: NavRoomId
  label: string
  icon: FC<{ className?: string }>
}

const ScaleIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="32" y1="10" x2="32" y2="54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="12" y1="10" x2="52" y2="10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="24" y1="54" x2="40" y2="54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="12" y1="10" x2="8" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="16" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M5 30 Q12 38 19 30" stroke="currentColor" strokeWidth="2.5" fill="#e8b84a" fillOpacity="0.35" strokeLinecap="round" />
    <line x1="52" y1="10" x2="48" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="52" y1="10" x2="56" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M45 28 Q52 36 59 28" stroke="currentColor" strokeWidth="2.5" fill="#e8b84a" fillOpacity="0.35" strokeLinecap="round" />
  </svg>
)

const FlameIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 6 C32 6 18 22 18 36 C18 44.8 24.3 52 32 52 C39.7 52 46 44.8 46 36 C46 22 32 6 32 6Z"
      fill="#f59e0b" fillOpacity="0.45" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"
    />
    <path
      d="M32 24 C32 24 25 32 25 38 C25 42.4 28.1 46 32 46 C35.9 46 39 42.4 39 38 C39 32 32 24 32 24Z"
      fill="#ef4444" fillOpacity="0.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
    />
    <rect x="14" y="52" width="36" height="6" rx="2" fill="#78716c" fillOpacity="0.5" stroke="currentColor" strokeWidth="2.5" />
  </svg>
)

const BeakerIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 8 L20 28 L12 50 C11 53 13 56 16 56 L48 56 C51 56 53 53 52 50 L44 28 L44 8"
      stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <line x1="16" y1="8" x2="48" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 38 L48 38 L52 50 C53 53 51 56 48 56 L16 56 C13 56 11 53 12 50 Z" fill="#3b82f6" fillOpacity="0.3" />
    <path d="M18 38 Q26 42 32 38 Q38 34 46 38" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

const FlaskIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 8 L24 24 L10 50 C8 54 11 58 15 58 L49 58 C53 58 56 54 54 50 L40 24 L40 8"
      stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <line x1="20" y1="8" x2="44" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 42 L50 42 L54 50 C56 54 53 58 49 58 L15 58 C11 58 8 54 10 50 Z" fill="#3b82f6" fillOpacity="0.3" />
    <path
      d="M50 42 Q54 38 56 34 Q58 30 54 30 Q50 30 52 34"
      fill="#3b82f6" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"
    />
    <path
      d="M52 34 Q56 30 54 26 Q52 22 50 26"
      fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"
    />
    <line x1="18" y1="36" x2="46" y2="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
  </svg>
)

const ScrollIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 10h28c2 0 4 2 4 4v44c0 2-2 4-4 4H18c-2 0-4-2-4-4V14c0-2 2-4 4-4z"
      fill="#faf3e0"
      fillOpacity="0.45"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path d="M26 22h20M26 30h20M26 38h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
    <path d="M44 48l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

const CrownIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 44 L14 18 L24 32 L32 12 L40 32 L50 18 L56 44 Z"
      fill="#f59e0b" fillOpacity="0.4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <rect x="8" y="44" width="48" height="8" rx="2" fill="#f59e0b" fillOpacity="0.35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="14" cy="18" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="12" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
    <circle cx="50" cy="18" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LockIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8 11V8a4 4 0 118 0v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

/** Nav-bar rooms only — the bath plays as a story cutscene, not a tab. */
const NAV_ROOMS: RoomDef[] = [
  { id: 'weigh', label: 'Weighing Chamber', icon: ScaleIcon },
  { id: 'furnace', label: 'Furnace', icon: FlameIcon },
  { id: 'waterLab', label: 'Water Lab', icon: BeakerIcon },
  { id: 'overflow', label: 'Overflow Lab', icon: FlaskIcon },
  { id: 'archimedes', label: "Archimedes' room", icon: ScrollIcon },
  { id: 'throne', label: 'Throne Room', icon: CrownIcon },
]

const OBJECTIVE_TEXT =
  "King Hiero suspects his crown is not pure gold. Explore each room to find a way to test it \u2014 without destroying the crown!"

interface ExplorationHubProps {
  onNavigate: (scene: SceneId) => void
  /** True when the hub was entered straight from the story intro — replays the guide. */
  forceGuide?: boolean
}

function ExplorationHubInner({ onNavigate, forceGuide = false }: ExplorationHubProps) {
  const { resetProgress, progress, patchProgress, triggerInsight } = useLessonHub()
  const audioEnabled = useOptionalAudioEnabled()

  const shouldOpenGuideOnMount = useMemo(() => {
    if (forceGuide || !progress.meta.hubGuideSeen) return true
    try {
      return sessionStorage.getItem(HUB_GUIDE_FROM_INTRO_KEY) === '1'
    } catch {
      return false
    }
  }, [forceGuide, progress.meta.hubGuideSeen])

  const [activeRoom, setActiveRoom] = useState<RoomId>('weigh')
  const [transitionKey, setTransitionKey] = useState(0)
  const [guideOpen, setGuideOpen] = useState(shouldOpenGuideOnMount)
  const [shareOpen, setShareOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [bathOverlayOpen, setBathOverlayOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const roomUnlocked = useMemo(() => getNavRoomUnlockState(progress), [progress])

  /** Per-room "all tasks done" flags, derived from saved lesson progress. */
  const roomCompletion = useMemo<Record<RoomId, boolean>>(
    () => getNavRoomCompletionState(progress),
    [progress],
  )

  /** Nav-bar buttons, so a completion/unlock celebration can fly back to the right slot. */
  const navRefs = useRef<Map<RoomId, HTMLButtonElement | null>>(new Map())
  type CelebrationKind = 'complete' | 'unlock'
  const [celebration, setCelebration] = useState<{
    room: RoomId
    dx: number
    dy: number
    kind: CelebrationKind
  } | null>(null)
  const celebrationQueueRef = useRef<{ room: RoomId; kind: CelebrationKind }[]>([])
  const celebrationActiveRef = useRef(false)
  const prevCompletionRef = useRef<Record<RoomId, boolean> | null>(null)
  const prevUnlockedRef = useRef<Record<RoomId, boolean> | null>(null)
  const pendingOverflowInsightRef = useRef(false)
  const bathUnlockCelebratedRef = useRef(false)
  const guideAutoOpenedRef = useRef(false)

  const queueCelebration = useCallback((room: RoomId, kind: CelebrationKind) => {
    celebrationQueueRef.current.push({ room, kind })
  }, [])

  const startNextCelebration = useCallback(() => {
    if (celebrationActiveRef.current || guideOpen) return
    const next = celebrationQueueRef.current.shift()
    if (!next) return
    celebrationActiveRef.current = true
    const el = navRefs.current.get(next.room)
    let dx = 0
    let dy = 0
    if (el) {
      const r = el.getBoundingClientRect()
      dx = r.left + r.width / 2 - window.innerWidth / 2
      dy = r.top + r.height / 2 - window.innerHeight / 2
    }
    setCelebration({ room: next.room, dx, dy, kind: next.kind })
  }, [guideOpen])

  /** Tada when the check/unlock badge stamps on the room icon (~1.4s into the burst). */
  useEffect(() => {
    if (!celebration) return
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : HUB_CHECK_STAMP_DELAY_MS
    const id = window.setTimeout(() => {
      playSoundEffect(TADA_EFFECT_SRC, audioEnabled)
    }, delay)
    return () => window.clearTimeout(id)
  }, [celebration, audioEnabled])

  const handleCelebrationEnd = useCallback(() => {
    const ended = celebration
    setCelebration(null)
    celebrationActiveRef.current = false
    if (
      ended?.kind === 'unlock' &&
      ended.room === 'overflow' &&
      pendingOverflowInsightRef.current
    ) {
      pendingOverflowInsightRef.current = false
      triggerInsight({
        kind: 'hint',
        transcript: OVERFLOW_UNLOCK_INSIGHT,
        audioSrc: '',
        label: 'Archimedes',
      })
    }
    startNextCelebration()
  }, [celebration, startNextCelebration, triggerInsight])

  /** Detect rooms that just flipped to complete and queue their celebration. */
  useEffect(() => {
    const prev = prevCompletionRef.current
    prevCompletionRef.current = roomCompletion
    if (!prev) return
    const newlyDone = NAV_ROOMS.filter(
      (r) => roomCompletion[r.id] && !prev[r.id],
    ).map((r) => r.id)
    if (newlyDone.length > 0) {
      newlyDone.forEach((room) => queueCelebration(room, 'complete'))
      startNextCelebration()
    }
  }, [roomCompletion, queueCelebration, startNextCelebration])

  /** Detect rooms that just became visitable (overflow unlocks via bath dismiss). */
  useEffect(() => {
    const prev = prevUnlockedRef.current
    prevUnlockedRef.current = roomUnlocked
    if (!prev) {
      if (roomUnlocked.overflow) {
        bathUnlockCelebratedRef.current = true
      }
      return
    }
    const newlyUnlocked = NAV_ROOMS.filter(
      (r) =>
        r.id !== 'overflow' &&
        roomUnlocked[r.id] &&
        !prev[r.id],
    ).map((r) => r.id)
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((room) => queueCelebration(room, 'unlock'))
      startNextCelebration()
    }
  }, [roomUnlocked, queueCelebration, startNextCelebration])

  const celebratingRoomDef = celebration
    ? NAV_ROOMS.find((r) => r.id === celebration.room) ?? null
    : null

  const handleResetProgress = useCallback(() => {
    if (
      !window.confirm(
        'Reset all workshop progress (scales, furnace, proof scroll, throne, etc.)? You will start fresh in the hub.',
      )
    ) {
      return
    }
    resetProgress()
    setActiveRoom('weigh')
    setBathOverlayOpen(false)
    bathUnlockCelebratedRef.current = false
    setGuideOpen(true)
    setTransitionKey((k) => k + 1)
  }, [resetProgress])

  const switchRoom = useCallback(
    (room: RoomId) => {
      if (room === activeRoom) return
      if (!roomUnlocked[room]) return
      setActiveRoom(room)
      setTransitionKey((k) => k + 1)
    },
    [activeRoom, roomUnlocked],
  )

  /** If progress changes and the current tab is locked, fall back to Weighing Chamber. */
  useEffect(() => {
    if (!roomUnlocked[activeRoom]) {
      setActiveRoom('weigh')
      setTransitionKey((k) => k + 1)
    }
  }, [activeRoom, roomUnlocked])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [activeRoom])

  /** Open the onboarding guide once per hub visit when appropriate. */
  useEffect(() => {
    if (guideAutoOpenedRef.current) return
    let fromIntro = false
    try {
      fromIntro = sessionStorage.getItem(HUB_GUIDE_FROM_INTRO_KEY) === '1'
    } catch {
      /* ignore */
    }
    const shouldOpen = !progress.meta.hubGuideSeen || forceGuide || fromIntro
    if (!shouldOpen) return
    guideAutoOpenedRef.current = true
    setGuideOpen(true)
  }, [forceGuide, progress.meta.hubGuideSeen])

  /** After the guide closes, play any unlock/complete celebrations that were waiting. */
  useEffect(() => {
    if (!guideOpen) {
      startNextCelebration()
    }
  }, [guideOpen, startNextCelebration])

  const closeGuide = useCallback(() => {
    setGuideOpen(false)
    patchProgress({ meta: { hubGuideSeen: true } })
    try {
      sessionStorage.removeItem(HUB_GUIDE_FROM_INTRO_KEY)
    } catch {
      /* ignore */
    }
  }, [patchProgress])

  const replayGuide = useCallback(() => {
    setActiveRoom('weigh')
    setGuideOpen(true)
  }, [])

  const handleDiscoveryCloseupDismissed = useCallback(() => {
    if (shouldTriggerBathCutscene(progress)) {
      setBathOverlayOpen(true)
    }
  }, [progress])

  const handleBathOverlayDismiss = useCallback(() => {
    setBathOverlayOpen(false)
    if (bathUnlockCelebratedRef.current) return
    if (progress.bath.storyIndex < 1) return
    bathUnlockCelebratedRef.current = true
    pendingOverflowInsightRef.current = true
    queueCelebration('overflow', 'unlock')
    startNextCelebration()
  }, [progress.bath.storyIndex, queueCelebration, startNextCelebration])

  /** Default room is Archimedes — preload LCP image early (60KB webp). */
  useEffect(() => {
    const href = papyrusImg
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = href
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [])

  const hubNavigate = useCallback(
    (scene: SceneId) => {
      const roomMap: Partial<Record<SceneId, RoomId>> = {
        weigh: 'weigh',
        melt: 'furnace',
        waterDiscovery: 'waterLab',
        displacement: 'overflow',
        finale: 'throne',
      }
      const mapped = roomMap[scene]
      if (mapped) {
        switchRoom(mapped)
      } else {
        onNavigate(scene)
      }
    },
    [onNavigate, switchRoom],
  )

  let roomContent: React.ReactNode
  switch (activeRoom) {
    case 'weigh':
      roomContent = <CrownWeighScene onNavigate={hubNavigate} />
      break
    case 'furnace':
      roomContent = <CrownMeltScene onNavigate={hubNavigate} />
      break
    case 'waterLab':
      roomContent = (
        <WaterDiscoveryScene
          onNavigate={hubNavigate}
          onDiscoveryCloseupDismissed={handleDiscoveryCloseupDismissed}
        />
      )
      break
    case 'overflow':
      roomContent = <DisplacementLabScene onNavigate={hubNavigate} />
      break
    case 'archimedes':
      roomContent = <ArchimedesRoomScene onNavigate={hubNavigate} />
      break
    case 'throne':
      roomContent = <StoryFinaleScene onNavigate={hubNavigate} />
      break
  }

  return (
    <div className="exploration-hub">
      <div className="hub-objective-banner">
        <button
          className="hub-intro-button"
          type="button"
          onClick={() => onNavigate('intro')}
        >
          Story intro
        </button>
        <button
          className="hub-intro-button hub-tips-button"
          type="button"
          onClick={replayGuide}
          title="Replay Archimedes' guided tips"
        >
          Tips
        </button>
        {import.meta.env.DEV ? (
          <>
            <button
              className="hub-intro-button hub-dev-share-button"
              type="button"
              onClick={() => setShareOpen(true)}
              title="DEV: preview the completion share card"
            >
              Share (dev)
            </button>
            <button
              className="hub-intro-button hub-dev-share-button"
              type="button"
              onClick={() => setFeedbackOpen(true)}
              title="DEV: preview the feedback form"
            >
              Feedback (dev)
            </button>
            <button
              className="hub-intro-button hub-dev-share-button"
              type="button"
              onClick={() => setInboxOpen(true)}
              title="DEV: read collected feedback"
            >
              Inbox (dev)
            </button>
          </>
        ) : null}
        <span className="hub-objective-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <p className="hub-objective-text">{OBJECTIVE_TEXT}</p>
        <button
          className="hub-reset-button"
          type="button"
          onClick={handleResetProgress}
          title="Clears saved lesson state so you can test from the beginning"
        >
          Reset progress
        </button>
        <button className="hub-menu-button" type="button" onClick={() => onNavigate('landing')}>
          Menu
        </button>
      </div>

      <div className="hub-room-content" ref={contentRef} key={transitionKey}>
        {roomContent}
      </div>

      <ArchimedesCompanion />

      <HubAmbientMusic />

      <HubOnboardingGuide open={guideOpen} onClose={closeGuide} />

      <EurekaShareCard open={shareOpen} onClose={() => setShareOpen(false)} />

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        context="hub"
      />

      {import.meta.env.DEV ? (
        <FeedbackInbox open={inboxOpen} onClose={() => setInboxOpen(false)} />
      ) : null}

      <nav className="hub-nav-bar" aria-label="Room navigation">
        {NAV_ROOMS.map((room) => {
          const Icon = room.icon
          const isActive = room.id === activeRoom
          const isComplete = roomCompletion[room.id]
          const isUnlocked = roomUnlocked[room.id]
          const isFlying = celebration?.room === room.id
          return (
            <button
              key={room.id}
              ref={(el) => {
                navRefs.current.set(room.id, el)
              }}
              className={`hub-nav-item${isActive ? ' hub-nav-item--active' : ''}${
                isComplete ? ' hub-nav-item--complete' : ''
              }${!isUnlocked ? ' hub-nav-item--locked' : ''}`}
              type="button"
              disabled={!isUnlocked}
              onClick={() => switchRoom(room.id)}
              data-room={room.id}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={!isUnlocked}
              title={
                !isUnlocked
                  ? 'Complete earlier rooms to unlock this experiment'
                  : room.label
              }
            >
              <span className="hub-nav-icon-wrap">
                <Icon className="hub-nav-icon" />
                {!isUnlocked ? (
                  <span className="hub-nav-lock" aria-hidden>
                    <LockIcon className="hub-nav-lock-icon" />
                  </span>
                ) : null}
                {isComplete ? (
                  <span
                    className={`hub-nav-check${isFlying ? ' hub-nav-check--pending' : ''}`}
                    aria-label="Room complete"
                  >
                    <CheckIcon className="hub-nav-check-mark" />
                  </span>
                ) : null}
              </span>
              <span className="hub-nav-label">{room.label}</span>
            </button>
          )
        })}
      </nav>

      {bathOverlayOpen ? (
        <div className="hub-bath-overlay" role="dialog" aria-modal="true" aria-label="Bathhouse story">
          <StoryBathScene
            onNavigate={hubNavigate}
            overlayMode
            onOverlayDismiss={handleBathOverlayDismiss}
          />
        </div>
      ) : null}

      {celebration && celebratingRoomDef ? (
        <div
          className="hub-completion-celebration"
          aria-live="polite"
          style={
            {
              '--fly-dx': `${celebration.dx}px`,
              '--fly-dy': `${celebration.dy}px`,
            } as CSSProperties
          }
        >
          <div
            className="hub-completion-burst"
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) handleCelebrationEnd()
            }}
          >
            <span className="hub-completion-stage">
              <span className="hub-completion-glow" aria-hidden />
              <span className="hub-completion-rays" aria-hidden />
              <span className="hub-completion-icon-wrap">
                {(() => {
                  const Icon = celebratingRoomDef.icon
                  return <Icon className="hub-completion-icon" />
                })()}
                <span
                  className={`hub-completion-check${
                    celebration.kind === 'unlock' ? ' hub-completion-check--unlock' : ''
                  }`}
                  aria-hidden
                >
                  {celebration.kind === 'unlock' ? (
                    <span className="hub-completion-unlock-mark">✦</span>
                  ) : (
                    <CheckIcon className="hub-completion-check-mark" />
                  )}
                </span>
              </span>
            </span>
            <span className="hub-completion-text">
              {celebration.kind === 'unlock'
                ? roomUnlockHeading(celebratingRoomDef.label)
                : roomCompleteHeading(celebratingRoomDef.label)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const ExplorationHub: FC<ExplorationHubProps> = (props) => (
  <LessonHubProvider>
    <ExplorationHubInner {...props} />
  </LessonHubProvider>
)

export default ExplorationHub
