import { useEffect, useRef, useState } from 'react'
import type { DataFunc, SuggestionDataItem } from 'react-mentions'

/**
 * Adapts a "fetch users for this record" API call into the debounced
 * (query, callback) shape react-mentions' <Mention data={...}> expects —
 * shared by every discussion thread's @mention composer.
 */
export function useMentionSuggestions(
  fetchUsers: (search: string) => Promise<{ id: number; name: string }[]>,
): DataFunc {
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  return (query, callback) => {
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      fetchUsers(query)
        .then((users) => callback(users.map((user): SuggestionDataItem => ({ id: user.id, display: user.name }))))
        .catch(() => callback([]))
    }, 250)
  }
}

/**
 * The composer's `<MentionsInput suggestionsPortalHost={document.body}>`
 * escapes the surrounding Card's `overflow-hidden` by positioning the
 * suggestions list `fixed` at viewport coordinates — but react-mentions only
 * recomputes those coordinates when its own props/state change, never on
 * scroll. Left alone, the dropdown stays glued to its last position while
 * the page scrolls underneath it. Forcing a re-render on scroll makes it
 * recompute against the textarea's current position.
 */
export function useRepositionMentionsOnScroll() {
  const [, forceRender] = useState(0)
  const frame = useRef<number>(undefined)

  useEffect(() => {
    const handleScroll = () => {
      if (frame.current !== undefined) return
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined
        forceRender((n) => n + 1)
      })
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    }
  }, [])
}
