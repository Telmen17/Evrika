import matterScriptUrl from '../../matter.min.js?url'

export interface MatterWindow extends Window {
  Matter?: any
}

export async function ensureMatterLoaded(): Promise<any> {
  const win = window as MatterWindow
  if (win.Matter) return win.Matter

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-evrika-matter="true"]',
    ) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Matter.js')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = matterScriptUrl
    script.async = true
    script.dataset.evrikaMatter = 'true'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load Matter.js')),
      { once: true },
    )
    document.head.appendChild(script)
  })

  const M = (window as MatterWindow).Matter
  if (!M) throw new Error('Matter.js missing after load')
  return M
}
