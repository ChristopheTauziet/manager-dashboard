import { readFileSync, writeFileSync } from 'fs'

const batchAD = JSON.parse(readFileSync('/Users/ctauziet/Desktop/Claude/Files/Interviews/extracted_batch_AD.json', 'utf8'))
const batchDK = JSON.parse(readFileSync('/Users/ctauziet/Desktop/Claude/Files/Interviews/interview_data.json', 'utf8'))
const batchLY = JSON.parse(readFileSync('/Users/ctauziet/Desktop/Claude/Files/Interviews/extracted_interview_data.json', 'utf8'))
const debriefs = JSON.parse(readFileSync('/Users/ctauziet/Library/CloudStorage/Dropbox/Sites/Manager dashboard/christophe_interview_feedback.json', 'utf8'))
const team = JSON.parse(readFileSync('/Users/ctauziet/Library/CloudStorage/Dropbox/Sites/Manager dashboard/data/team.json', 'utf8'))
const archive = JSON.parse(readFileSync('/Users/ctauziet/Library/CloudStorage/Dropbox/Sites/Manager dashboard/data/team_archive.json', 'utf8'))

const teamNames = new Set(team.map(t => t.name.toLowerCase()))
const archiveNames = new Set(archive.map(t => t.name.toLowerCase()))

const nameAliases = {
  'maria sanchez mallona': 'gabbi sanchez mallona',
  'geoffrey kim': 'geoff kim',
  'anthony murphy': 'tony murphy',
  'caitlin scott': 'taryn arnold scott',
  'christie fremon': 'christie freeman',
  'andrea baltazar': 'andrea balthazar',
  'elliott hutchison': 'elliott htchison',
  'sarah cantrell': 'sarah cantu',
}

function normalize(name) {
  const lower = name.toLowerCase().trim()
  return nameAliases[lower] || lower
}

function normalizeDate(d) {
  if (!d || d === '') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const parts = d.split('/')
  if (parts.length === 3) {
    let [m, day, y] = parts
    if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y
    return `${y}-${m.padStart(2,'0')}-${day.padStart(2,'0')}`
  }
  return d
}

function hasContent(round) {
  return (round.did_well && round.did_well.trim() !== '') ||
         (round.did_not_well && round.did_not_well.trim() !== '') ||
         (round.thoughts && round.thoughts.trim() !== '' &&
          !round.thoughts.includes('Template questions') &&
          !round.thoughts.includes('no answers or evaluations') &&
          !round.thoughts.includes('no notes or evaluations') &&
          !round.thoughts.includes('No candidate evaluation'))
}

const candidateMap = new Map()

function addRounds(entries) {
  for (const entry of entries) {
    const key = normalize(entry.name)
    if (!candidateMap.has(key)) {
      candidateMap.set(key, {
        name: entry.name,
        role: entry.role,
        rounds: []
      })
    }
    const existing = candidateMap.get(key)
    if (entry.role && (!existing.role || existing.role === 'D7' || existing.role.includes('from Jacquelynn'))) {
      existing.role = entry.role
    }
    for (const round of (entry.rounds || [])) {
      const r = {
        round_name: round.round_name || '',
        date: normalizeDate(round.date || ''),
        did_well: typeof round.did_well === 'string' ? round.did_well : '',
        did_not_well: typeof round.did_not_well === 'string' ? round.did_not_well : '',
        thoughts: typeof round.thoughts === 'string' ? round.thoughts : '',
      }
      const isDuplicate = existing.rounds.some(
        er => er.round_name === r.round_name && er.date === r.date && er.did_well === r.did_well
      )
      if (!isDuplicate) {
        existing.rounds.push(r)
      }
    }
  }
}

addRounds(batchAD)
addRounds(batchDK)
addRounds(batchLY)

const debriefMap = new Map()
for (const d of debriefs) {
  const key = normalize(d.name)
  if (!debriefMap.has(key)) {
    debriefMap.set(key, d)
  } else {
    const existing = debriefMap.get(key)
    if (d.ratings && !existing.ratings) existing.ratings = d.ratings
    if (d.recommendation && !existing.recommendation) existing.recommendation = d.recommendation
    if (d.decision && !existing.decision) existing.decision = d.decision
  }
}

for (const [key, d] of debriefMap) {
  if (!candidateMap.has(key)) {
    candidateMap.set(key, {
      name: d.name,
      role: d.role,
      rounds: []
    })
  }
}

const candidates = []
let id = 1

for (const [key, c] of candidateMap) {
  const hasSubstantiveRounds = c.rounds.some(hasContent)
  const hasDebrief = debriefMap.has(key)

  if (!hasSubstantiveRounds && !hasDebrief) continue

  const debrief = debriefMap.get(key)

  let status = 'Rejected'
  if (teamNames.has(key)) {
    status = 'Hired'
  } else if (archiveNames.has(key)) {
    status = 'Hired'
  } else if (debrief?.decision === 'Offer') {
    status = 'Offer'
  } else if (debrief?.ratings) {
    const ratingStr = debrief.ratings.toLowerCase()
    if (ratingStr.includes('strong hire') || ratingStr.includes('4')) {
      status = 'Rejected'
    } else if (ratingStr.includes('no hire') || ratingStr.includes('1') || ratingStr.includes('2')) {
      status = 'Rejected'
    }
  }

  let recommendation = ''
  if (debrief?.ratings) {
    recommendation = debrief.ratings
  }

  let debrief_notes = ''
  if (debrief?.recommendation) {
    debrief_notes = debrief.recommendation
  }

  const contentRounds = c.rounds.filter(hasContent)

  let lastDate = ''
  for (const r of contentRounds) {
    if (r.date && r.date > lastDate) lastDate = r.date
  }

  let cleanRole = c.role
    .replace(/\s*\(from .*?\)\s*/g, '')
    .replace(/, \d{3,4}$/, '')
    .replace(/\s*1$/, '')

  candidates.push({
    id: String(id++),
    name: c.name,
    role: cleanRole,
    status,
    last_activity_date: lastDate,
    recommendation,
    debrief_notes,
    interview_rounds: contentRounds.map(r => ({
      round_name: r.round_name,
      date: r.date,
      did_well: r.did_well,
      did_not_well: r.did_not_well,
      thoughts: r.thoughts,
    }))
  })
}

candidates.sort((a, b) => a.name.localeCompare(b.name))

writeFileSync(
  '/Users/ctauziet/Library/CloudStorage/Dropbox/Sites/Manager dashboard/data/candidates.json',
  JSON.stringify(candidates, null, 2)
)

console.log(`Written ${candidates.length} candidates to candidates.json`)
