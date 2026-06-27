import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement, type ReactNode } from 'react'
import {
  DEFAULT_LESSON_PROGRESS,
  LessonHubProvider,
  type LessonProgress,
  type LessonProgressPatch,
} from '@/context/LessonHubContext'

export function mergeLessonProgress(
  base: LessonProgress,
  patch: LessonProgressPatch,
): LessonProgress {
  return {
    ...base,
    weigh: { ...base.weigh, ...patch.weigh },
    melt: { ...base.melt, ...patch.melt },
    waterLab: { ...base.waterLab, ...patch.waterLab },
    bath: { ...base.bath, ...patch.bath },
    overflow: { ...base.overflow, ...patch.overflow },
    archimedes: { ...base.archimedes, ...patch.archimedes },
    throne: { ...base.throne, ...patch.throne },
    meta: { ...base.meta, ...patch.meta },
  }
}

export function createLessonProgress(patch: LessonProgressPatch = {}): LessonProgress {
  return mergeLessonProgress(structuredClone(DEFAULT_LESSON_PROGRESS), patch)
}

function Providers({ children }: { children: ReactNode }) {
  return <LessonHubProvider>{children}</LessonHubProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}
