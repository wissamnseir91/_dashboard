import { useEffect } from 'react'

export function useDebouncedEffect(effect: () => void, deps: unknown[], delayMs: number) {
  useEffect(() => {
    const timeout = setTimeout(effect, delayMs)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs])
}
