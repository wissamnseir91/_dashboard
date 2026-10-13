import type { ReactNode } from 'react'

/** Page-level actions (e.g. add a record) pinned to the bottom-right corner of the viewport. */
export function FloatingActions({ children }: { children: ReactNode }) {
  return <div className="fixed right-6 bottom-6 z-40 flex items-center gap-2 drop-shadow-lg">{children}</div>
}
