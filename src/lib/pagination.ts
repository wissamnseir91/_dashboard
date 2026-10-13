export type PageToken = number | 'ellipsis'

/**
 * Classic "1 2 3 … 79 80" truncation: always show the first and last page,
 * plus `siblings` pages on either side of the current page, collapsing any
 * gap larger than one page into a single ellipsis.
 */
export function getPageTokens(current: number, total: number, siblings = 1): PageToken[] {
  const totalNumbers = siblings * 2 + 5

  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblings, 1)
  const rightSibling = Math.min(current + siblings, total)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + siblings * 2
    return [...Array.from({ length: leftCount }, (_, i) => i + 1), 'ellipsis', total]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + siblings * 2
    return [1, 'ellipsis', ...Array.from({ length: rightCount }, (_, i) => total - rightCount + 1 + i)]
  }

  return [
    1,
    'ellipsis',
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i),
    'ellipsis',
    total,
  ]
}
