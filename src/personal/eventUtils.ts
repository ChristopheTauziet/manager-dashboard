import giftsData from '../../data/gifts.json'

export interface EventEntry {
  name: string
  occasion: string
  month: number
  day: number
}

export const jsonEvents: EventEntry[] = giftsData.events as EventEntry[]

function nthSundayOf(year: number, month: number, n: number) {
  const first = new Date(year, month, 1)
  const firstSunday = (7 - first.getDay()) % 7 + 1
  return firstSunday + (n - 1) * 7
}

function lastSundayOf(year: number, month: number) {
  const last = new Date(year, month + 1, 0)
  return last.getDate() - last.getDay()
}

function getEasterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function getUSMothersDay(year: number) {
  return { month: 5, day: nthSundayOf(year, 4, 2) }
}

function getFrenchMothersDay(year: number) {
  const lastSunMay = lastSundayOf(year, 4)
  const pentecost = new Date(getEasterSunday(year).getTime() + 49 * 86400000)
  if (pentecost.getMonth() === 4 && pentecost.getDate() === lastSunMay) {
    return { month: 6, day: nthSundayOf(year, 5, 1) }
  }
  return { month: 5, day: lastSunMay }
}

function getFathersDay(year: number) {
  return { month: 6, day: nthSundayOf(year, 5, 3) }
}

function getGrandmasDay(year: number) {
  return { month: 3, day: nthSundayOf(year, 2, 1) }
}

function getGrandpasDay(year: number) {
  return { month: 10, day: nthSundayOf(year, 9, 1) }
}

export function getAllEvents(year: number): EventEntry[] {
  const usMom = getUSMothersDay(year)
  const frMom = getFrenchMothersDay(year)
  const dad = getFathersDay(year)
  const grandma = getGrandmasDay(year)
  const grandpa = getGrandpasDay(year)

  const dynamicEvents: EventEntry[] = [
    { name: "Maman & Brigitte", occasion: "Fête des grands-mères", ...grandma },
    { name: "Claire", occasion: "Mother's Day", ...usMom },
    { name: "Maman", occasion: "Fête des Mères", ...frMom },
    { name: "Papa", occasion: "Fête des Pères", ...dad },
    { name: "Papa & Domi", occasion: "Fête des grands-pères", ...grandpa },
  ]
  return [...jsonEvents, ...dynamicEvents]
}
