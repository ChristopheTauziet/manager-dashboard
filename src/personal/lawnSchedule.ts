import lawnData from '../../data/lawn-calendar.json'

export type LawnWindowRecord = {
  id: string
  window: { start: readonly [number, number]; end: readonly [number, number] }
  emoji: string
  rangeLabel: string
  reminder: string
  items: string[]
  optional?: boolean
  dormant?: boolean
  /** If false, do not show on Overview reminder widget (e.g. “maintain only” months). Default true. */
  overview?: boolean
}

function monthDayKey(month: number, day: number): number {
  return month * 100 + day
}

/** Whether (month, day) falls in [start, end] on the annual calendar; supports windows that wrap New Year’s. */
export function isDateInLawnWindow(
  month: number,
  day: number,
  start: readonly [number, number],
  end: readonly [number, number]
): boolean {
  const cur = monthDayKey(month, day)
  const a = monthDayKey(start[0], start[1])
  const b = monthDayKey(end[0], end[1])
  if (a <= b) return cur >= a && cur <= b
  return cur >= a || cur <= b
}

/**
 * Active lawn calendar windows for today (Northern Hemisphere lawn schedule).
 * Excludes dormant periods. Respects `overview: false` for windows that should not surface on Overview.
 */
export function getActiveLawnWindowsForOverview(date: Date = new Date()): LawnWindowRecord[] {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const { windows } = lawnData as unknown as { windows: LawnWindowRecord[] }

  return windows.filter(w => {
    if (w.dormant) return false
    if (w.overview === false) return false
    if (!w.window?.start || !w.window?.end) return false
    return isDateInLawnWindow(month, day, w.window.start, w.window.end)
  })
}
