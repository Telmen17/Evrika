import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react'

/** localStorage key — clear this in dev tools or use “Reset progress” in the hub to test from scratch. */
export const LESSON_HUB_STORAGE_KEY = 'evrika-hub-progress-v1'

export type WeighMissionPhaseSave = 'crown' | 'lump' | 'done'

/** Serialized scale layout (matches CrownWeighScene pan items). */
export interface WeighPlacedItemSave {
  instanceId: string
  type: string
  pan: 'left' | 'right'
}
export type MeltPhaseSave =
  | 'quiz'
  | 'quizFeedback'
  | 'forge'
  | 'guard'
  | 'returnCrown'
  | 'done'

export type CompanionInsightKind = 'balance' | 'crownAnswer' | 'hint'

export interface LessonProgress {
  weigh: {
    weighPhase: WeighMissionPhaseSave
    massGuess: string
    massCheckFeedback: string
    playedBalanceInsight: boolean
    playedCrownAnswerInsight: boolean
    placedItems: WeighPlacedItemSave[]
    nextItemId: number
  }
  melt: {
    phase: MeltPhaseSave
    quizChoice: string | null
    crownAtForge: boolean
    /** Guard sprite step (0–2); persisted so the guard stays visible after leaving the room. */
    guardPose: number
    /** True once the guard speech bubble should show (persisted). */
    guardSpeechShown: boolean
  }
  waterLab: {
    discoverySeen: boolean
  }
  bath: {
    storyIndex: number
    bathPhase: 'idle' | 'stepIn' | 'submerged' | 'overflow'
    archFrame: number
  }
  overflow: {
    hasCompared: boolean
  }
  archimedes: {
    crownMassG: string
    crownVolumeMl: string
    lumpMassG: string
    lumpVolumeMl: string
    proofUnlocked: boolean
  }
  throne: {
    proofPresented: boolean
    beatIndex: number
  }
}

export const DEFAULT_LESSON_PROGRESS: LessonProgress = {
  weigh: {
    weighPhase: 'crown',
    massGuess: '',
    massCheckFeedback: '',
    playedBalanceInsight: false,
    playedCrownAnswerInsight: false,
    placedItems: [],
    nextItemId: 0,
  },
  melt: {
    phase: 'quiz',
    quizChoice: null,
    crownAtForge: false,
    guardPose: 0,
    guardSpeechShown: false,
  },
  waterLab: { discoverySeen: false },
  bath: { storyIndex: 0, bathPhase: 'idle', archFrame: 0 },
  overflow: { hasCompared: false },
  archimedes: {
    crownMassG: '',
    crownVolumeMl: '',
    lumpMassG: '',
    lumpVolumeMl: '',
    proofUnlocked: false,
  },
  throne: { proofPresented: false, beatIndex: 0 },
}

/** Shallow merge per room; nested slices are partial updates. */
export type LessonProgressPatch = {
  weigh?: Partial<LessonProgress['weigh']>
  melt?: Partial<LessonProgress['melt']>
  waterLab?: Partial<LessonProgress['waterLab']>
  bath?: Partial<LessonProgress['bath']>
  overflow?: Partial<LessonProgress['overflow']>
  archimedes?: Partial<LessonProgress['archimedes']>
  throne?: Partial<LessonProgress['throne']>
}

function deepMergeProgress(
  base: LessonProgress,
  patch: LessonProgressPatch,
): LessonProgress {
  const next: LessonProgress = { ...base }
  if (patch.weigh) next.weigh = { ...base.weigh, ...patch.weigh }
  if (patch.melt) next.melt = { ...base.melt, ...patch.melt }
  if (patch.waterLab) next.waterLab = { ...base.waterLab, ...patch.waterLab }
  if (patch.bath) next.bath = { ...base.bath, ...patch.bath }
  if (patch.overflow) next.overflow = { ...base.overflow, ...patch.overflow }
  if (patch.archimedes)
    next.archimedes = { ...base.archimedes, ...patch.archimedes }
  if (patch.throne) next.throne = { ...base.throne, ...patch.throne }
  return next
}

function loadStoredProgress(): LessonProgress {
  try {
    const raw = localStorage.getItem(LESSON_HUB_STORAGE_KEY)
    if (!raw) return DEFAULT_LESSON_PROGRESS
    const parsed = JSON.parse(raw) as LessonProgressPatch
    return deepMergeProgress(DEFAULT_LESSON_PROGRESS, parsed)
  } catch {
    return DEFAULT_LESSON_PROGRESS
  }
}

export interface CompanionState {
  bubbleOpen: boolean
  insightKind: CompanionInsightKind | null
  transcript: string
  audioSrc: string | null
  insightLabel: string
}

const DEFAULT_COMPANION: CompanionState = {
  bubbleOpen: false,
  insightKind: null,
  transcript: '',
  audioSrc: null,
  insightLabel: 'Archimedes',
}

interface LessonHubContextValue {
  progress: LessonProgress
  patchProgress: (patch: LessonProgressPatch) => void
  resetProgress: () => void
  companion: CompanionState
  setCompanionBubbleOpen: (open: boolean) => void
  triggerInsight: (opts: {
    kind: CompanionInsightKind
    transcript: string
    audioSrc: string
    label?: string
    autoOpen?: boolean
  }) => void
  clearCompanionAudio: () => void
}

const LessonHubContext = createContext<LessonHubContextValue | null>(null)

export const LessonHubProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<LessonProgress>(() =>
    typeof window !== 'undefined' ? loadStoredProgress() : DEFAULT_LESSON_PROGRESS,
  )
  const [companion, setCompanion] = useState<CompanionState>(DEFAULT_COMPANION)

  useEffect(() => {
    try {
      localStorage.setItem(LESSON_HUB_STORAGE_KEY, JSON.stringify(progress))
    } catch {
      /* ignore */
    }
  }, [progress])

  const patchProgress = useCallback((patch: LessonProgressPatch) => {
    setProgress((prev) => deepMergeProgress(prev, patch))
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_LESSON_PROGRESS)
    try {
      localStorage.removeItem(LESSON_HUB_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const setCompanionBubbleOpen = useCallback((open: boolean) => {
    setCompanion((c) => ({ ...c, bubbleOpen: open }))
  }, [])

  const triggerInsight = useCallback(
    (opts: {
      kind: CompanionInsightKind
      transcript: string
      audioSrc: string
      label?: string
      autoOpen?: boolean
    }) => {
      setCompanion({
        bubbleOpen: opts.autoOpen !== false,
        insightKind: opts.kind,
        transcript: opts.transcript,
        audioSrc: opts.audioSrc,
        insightLabel: opts.label ?? 'Archimedes',
      })
    },
    [],
  )

  const clearCompanionAudio = useCallback(() => {
    setCompanion((c) => ({ ...c, audioSrc: null }))
  }, [])

  const value = useMemo(
    () => ({
      progress,
      patchProgress,
      resetProgress,
      companion,
      setCompanionBubbleOpen,
      triggerInsight,
      clearCompanionAudio,
    }),
    [
      progress,
      patchProgress,
      resetProgress,
      companion,
      setCompanionBubbleOpen,
      triggerInsight,
      clearCompanionAudio,
    ],
  )

  return (
    <LessonHubContext.Provider value={value}>{children}</LessonHubContext.Provider>
  )
}

export function useLessonHub(): LessonHubContextValue {
  const ctx = useContext(LessonHubContext)
  if (!ctx) {
    throw new Error('useLessonHub must be used within LessonHubProvider')
  }
  return ctx
}

export function useOptionalLessonHub(): LessonHubContextValue | null {
  return useContext(LessonHubContext)
}
