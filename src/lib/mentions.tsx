import { Fragment } from 'react'

const MENTION_PATTERN = /@\[([^\]]+)\]\(\d+\)/g

/**
 * Renders react-mentions' raw "@[Name](id)" markup as highlighted @Name
 * spans, for displaying a posted comment body (as opposed to the live
 * composer, which react-mentions renders itself).
 */
export function renderMentionText(body: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) parts.push(body.slice(lastIndex, index))
    parts.push(
      <span key={index} className="bg-accent text-accent-foreground rounded px-1 py-0.5 font-medium">
        @{match[1]}
      </span>,
    )
    lastIndex = index + match[0].length
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex))

  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)
}
