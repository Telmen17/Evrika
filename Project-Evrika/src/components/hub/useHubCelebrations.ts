/**
 * useHubCelebrations — hub room complete/unlock celebration queue and effects.
 *
 * Responsibility: celebration queue, fly-back positioning, sound, overflow unlock insight.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isRoomUnlocked,
  OVERFLOW_UNLOCK_INSIGHT,
  type NavRoomId,
} from '../../lib/hubRooms'
import type { LessonProgress } from '../../context/LessonHubContext'
import {
  playSoundEffect,
  preloadSoundEffects,
  warmSoundEffects,
  HUB_CELEBRATION_DURATION_MS,
  HUB_UNLOCK_CELEBRATION_DURATION_MS,
  HUB_CELEBRATION_REDUCED_MS,
  HUB_CHECK_STAMP_DELAY_MS,
  HUB_UNLOCK_STAMP_DELAY_MS,
  TADA_EFFECT_SRC,
  UNLOCK_EFFECT_SRC,
} from '../../lib/playSoundEffect'
import { NAV_ROOMS, type RoomDef } from './hubNavIcons'

export type CelebrationKind = 'complete' | 'unlock'

export interface CelebrationState {
  room: NavRoomId
  dx: number
  dy: number
  kind: CelebrationKind
}

interface UseHubCelebrationsParams {
  roomCompletion: Record<NavRoomId, boolean>
  roomUnlocked: Record<NavRoomId, boolean>
  bathOverlayOpen: boolean
  guideOpen: boolean
  triggerInsight: (payload: {
    kind: 'hint'
    transcript: string
    audioSrc: string
    label: string
  }) => void
  audioEnabled: boolean | undefined
}

export function useHubCelebrations({
  roomCompletion,
  roomUnlocked,
  bathOverlayOpen,
  guideOpen,
  triggerInsight,
  audioEnabled,
}: UseHubCelebrationsParams) {
  /** Nav-bar buttons, so a completion/unlock celebration can fly back to the right slot. */
  const navRefs = useRef<Map<NavRoomId, HTMLButtonElement | null>>(new Map())
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const celebrationQueueRef = useRef<{ room: NavRoomId; kind: CelebrationKind }[]>([])
  const celebrationActiveRef = useRef(false)
  const celebrationRef = useRef(celebration)
  celebrationRef.current = celebration
  const celebrationEndTimerRef = useRef<number | null>(null)
  const prevCompletionRef = useRef<Record<NavRoomId, boolean> | null>(null)
  const prevUnlockedRef = useRef<Record<NavRoomId, boolean> | null>(null)
  const pendingOverflowInsightRef = useRef(false)
  const bathUnlockCelebratedRef = useRef(false)
  const audioWarmedRef = useRef(false)

  const queueCelebration = useCallback((room: NavRoomId, kind: CelebrationKind) => {
    celebrationQueueRef.current.push({ room, kind })
  }, [])

  const clearCelebrationEndTimer = useCallback(() => {
    if (celebrationEndTimerRef.current != null) {
      window.clearTimeout(celebrationEndTimerRef.current)
      celebrationEndTimerRef.current = null
    }
  }, [])

  const startNextCelebration = useCallback(() => {
    if (celebrationActiveRef.current) return
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
  }, [])

  const finishCelebration = useCallback(() => {
    if (!celebrationActiveRef.current) return
    clearCelebrationEndTimer()
    const ended = celebrationRef.current
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
  }, [clearCelebrationEndTimer, startNextCelebration, triggerInsight])

  /** Safety net: always end the burst even if CSS animationend never fires. */
  useEffect(() => {
    if (!celebration) return
    clearCelebrationEndTimer()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ms = reducedMotion
      ? HUB_CELEBRATION_REDUCED_MS
      : celebration.kind === 'unlock'
        ? HUB_UNLOCK_CELEBRATION_DURATION_MS
        : HUB_CELEBRATION_DURATION_MS
    celebrationEndTimerRef.current = window.setTimeout(() => {
      celebrationEndTimerRef.current = null
      finishCelebration()
    }, ms)
    return () => clearCelebrationEndTimer()
  }, [celebration, clearCelebrationEndTimer, finishCelebration])

  /** Tada / unlock chime when the badge stamps (~1.4s into the burst). */
  useEffect(() => {
    if (!celebration) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isUnlock = celebration.kind === 'unlock'
    const delay = reducedMotion
      ? 320
      : isUnlock
        ? HUB_UNLOCK_STAMP_DELAY_MS
        : HUB_CHECK_STAMP_DELAY_MS
    const src = isUnlock ? UNLOCK_EFFECT_SRC : TADA_EFFECT_SRC
    const id = window.setTimeout(() => {
      playSoundEffect(src, audioEnabled ?? false, isUnlock ? 0.9 : 1)
    }, delay)
    return () => window.clearTimeout(id)
  }, [celebration, audioEnabled])

  const warmCelebrationAudio = useCallback(() => {
    if (audioWarmedRef.current) return
    audioWarmedRef.current = true
    warmSoundEffects([TADA_EFFECT_SRC, UNLOCK_EFFECT_SRC])
  }, [])

  /** Prime celebration clips on first hub interaction (avoids delayed-play blocking). */
  useEffect(() => {
    preloadSoundEffects([TADA_EFFECT_SRC, UNLOCK_EFFECT_SRC])
  }, [])

  const handleCelebrationEnd = useCallback(() => {
    finishCelebration()
  }, [finishCelebration])

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

  /** Detect rooms that just became visitable (overflow waits until bath overlay closes). */
  useEffect(() => {
    const prev = prevUnlockedRef.current
    prevUnlockedRef.current = roomUnlocked
    if (!prev) {
      if (roomUnlocked.overflow) {
        bathUnlockCelebratedRef.current = true
      }
      return
    }

    let queued = false
    for (const room of NAV_ROOMS) {
      if (!roomUnlocked[room.id] || prev[room.id]) continue
      if (room.id === 'overflow') {
        if (bathOverlayOpen || bathUnlockCelebratedRef.current) continue
        bathUnlockCelebratedRef.current = true
        pendingOverflowInsightRef.current = true
      }
      queueCelebration(room.id, 'unlock')
      queued = true
    }
    if (queued) {
      startNextCelebration()
    }
  }, [roomUnlocked, bathOverlayOpen, queueCelebration, startNextCelebration])

  const celebratingRoomDef: RoomDef | null = celebration
    ? NAV_ROOMS.find((r) => r.id === celebration.room) ?? null
    : null

  /** After the guide closes, play any unlock/complete celebrations that were waiting. */
  useEffect(() => {
    startNextCelebration()
  }, [guideOpen, startNextCelebration])

  const resetCelebrations = useCallback(() => {
    bathUnlockCelebratedRef.current = false
    prevCompletionRef.current = null
    prevUnlockedRef.current = null
    celebrationQueueRef.current = []
    clearCelebrationEndTimer()
    setCelebration(null)
    celebrationActiveRef.current = false
  }, [clearCelebrationEndTimer])

  const onBathOverlayDismiss = useCallback(
    (storyComplete: boolean | undefined, progress: LessonProgress) => {
      if (bathUnlockCelebratedRef.current) return
      const overflowReady =
        storyComplete === true ||
        progress.bath.storyIndex >= 1 ||
        isRoomUnlocked(progress, 'overflow')
      if (!overflowReady) return
      bathUnlockCelebratedRef.current = true
      pendingOverflowInsightRef.current = true
      queueCelebration('overflow', 'unlock')
      startNextCelebration()
    },
    [queueCelebration, startNextCelebration],
  )

  return {
    celebration,
    celebratingRoomDef,
    navRefs,
    warmCelebrationAudio,
    handleCelebrationEnd,
    resetCelebrations,
    onBathOverlayDismiss,
  }
}
