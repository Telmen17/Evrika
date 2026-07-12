/**
 * ExplorationHub — multi-room lesson hub shell and room router.
 *
 * Responsibility: objective banner, active room scene, bath overlay, nav chrome.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import {
  type FC,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react'
import type { SceneId } from '../types/sceneId'
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
  HUB_GUIDE_OPEN_DELAY_MS,
  shouldTriggerBathCutscene,
} from '../lib/hubRooms'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'
import { OBJECTIVE_TEXT } from './hub/hubNavIcons'
import { HubNavBar } from './hub/HubNavBar'
import { HubCelebrationOverlay } from './hub/HubCelebrationOverlay'
import { useHubNavigate, type RoomId } from './hub/useHubNavigation'
import { useHubCelebrations } from './hub/useHubCelebrations'

interface ExplorationHubProps {
  onNavigate: (scene: SceneId) => void
  /** True when the hub was entered straight from the story intro — replays the guide. */
  forceGuide?: boolean
}

function ExplorationHubInner({ onNavigate, forceGuide = false }: ExplorationHubProps) {
  const { resetProgress, progress, patchProgress, triggerInsight } = useLessonHub()
  const audioEnabled = useOptionalAudioEnabled()

  const [activeRoom, setActiveRoom] = useState<RoomId>('weigh')
  const [transitionKey, setTransitionKey] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [bathOverlayOpen, setBathOverlayOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const companionHeadRef = useRef<HTMLButtonElement>(null)

  const roomUnlocked = useMemo(() => getNavRoomUnlockState(progress), [progress])

  /** Per-room "all tasks done" flags, derived from saved lesson progress. */
  const roomCompletion = useMemo<Record<RoomId, boolean>>(
    () => getNavRoomCompletionState(progress),
    [progress],
  )

  const {
    celebration,
    celebratingRoomDef,
    navRefs,
    warmCelebrationAudio,
    handleCelebrationEnd,
    resetCelebrations,
    onBathOverlayDismiss,
  } = useHubCelebrations({
    roomCompletion,
    roomUnlocked,
    bathOverlayOpen,
    guideOpen,
    triggerInsight,
    audioEnabled,
  })

  const guideAutoOpenedRef = useRef(false)
  const guideOpenTimerRef = useRef<number | null>(null)

  const clearGuideOpenTimer = useCallback(() => {
    if (guideOpenTimerRef.current != null) {
      window.clearTimeout(guideOpenTimerRef.current)
      guideOpenTimerRef.current = null
    }
  }, [])

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
    resetCelebrations()
    clearGuideOpenTimer()
    guideAutoOpenedRef.current = true
    setGuideOpen(true)
    setTransitionKey((k) => k + 1)
  }, [resetProgress, clearGuideOpenTimer, resetCelebrations])

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

  /** Open the onboarding guide once per hub visit, after a short orienting pause. */
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

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reducedMotion ? 400 : HUB_GUIDE_OPEN_DELAY_MS
    guideOpenTimerRef.current = window.setTimeout(() => {
      guideOpenTimerRef.current = null
      guideAutoOpenedRef.current = true
      setGuideOpen(true)
    }, delay)

    return () => {
      clearGuideOpenTimer()
    }
  }, [forceGuide, progress.meta.hubGuideSeen, clearGuideOpenTimer])

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
    clearGuideOpenTimer()
    guideAutoOpenedRef.current = true
    setActiveRoom('weigh')
    setGuideOpen(true)
  }, [clearGuideOpenTimer])

  const handleDiscoveryCloseupDismissed = useCallback(() => {
    if (shouldTriggerBathCutscene(progress)) {
      setBathOverlayOpen(true)
    }
  }, [progress])

  const handleBathOverlayDismiss = useCallback(
    (storyComplete?: boolean) => {
      setBathOverlayOpen(false)
      onBathOverlayDismiss(storyComplete, progress)
    },
    [progress, onBathOverlayDismiss],
  )

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

  const hubNavigate = useHubNavigate(switchRoom, onNavigate)

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
    <div className="exploration-hub" onPointerDownCapture={warmCelebrationAudio}>
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

      {activeRoom !== 'waterLab' ? (
        <ArchimedesCompanion
          headRef={companionHeadRef}
          headFloating={guideOpen}
        />
      ) : null}

      <HubAmbientMusic />

      <HubOnboardingGuide
        open={guideOpen}
        onClose={closeGuide}
        companionHeadRef={companionHeadRef}
      />

      <EurekaShareCard open={shareOpen} onClose={() => setShareOpen(false)} />

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        context="hub"
      />

      {import.meta.env.DEV ? (
        <FeedbackInbox open={inboxOpen} onClose={() => setInboxOpen(false)} />
      ) : null}

      <HubNavBar
        activeRoom={activeRoom}
        roomCompletion={roomCompletion}
        roomUnlocked={roomUnlocked}
        celebration={celebration}
        navRefs={navRefs}
        onSwitchRoom={switchRoom}
      />

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
        <HubCelebrationOverlay
          celebration={celebration}
          celebratingRoomDef={celebratingRoomDef}
          onCelebrationEnd={handleCelebrationEnd}
        />
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
