/** Configurable `window.matchMedia` mock for viewport-dependent hooks and gates. */
export function mockMatchMedia(width: number): void {
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>()

  window.matchMedia = vi.fn((query: string) => {
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/)
    const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/)

    let matches = false
    if (minWidthMatch) {
      matches = width >= Number(minWidthMatch[1])
    } else if (maxWidthMatch) {
      matches = width <= Number(maxWidthMatch[1])
    }

    const mql: MediaQueryList = {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event, listener) => {
        const set = listeners.get(query) ?? new Set()
        set.add(listener as (event: MediaQueryListEvent) => void)
        listeners.set(query, set)
      },
      removeEventListener: (_event, listener) => {
        listeners.get(query)?.delete(listener as (event: MediaQueryListEvent) => void)
      },
      dispatchEvent: vi.fn(),
    }

    return mql
  }) as typeof window.matchMedia
}

export function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  mockMatchMedia(width)
}
