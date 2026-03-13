import { readFileSync, writeFileSync } from 'fs'

const csv = readFileSync('/Users/ctauziet/Downloads/Employee Data - 2025 Year End Cycle - 2026-03-13.csv', 'utf8')

// Proper CSV parser that handles quoted fields with newlines
function parseCSV(text) {
  const rows = []
  let current = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field.trim())
        field = ''
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        current.push(field.trim())
        field = ''
        if (current.length > 1) rows.push(current)
        current = []
      } else {
        field += ch
      }
    }
  }
  if (field || current.length) {
    current.push(field.trim())
    if (current.length > 1) rows.push(current)
  }
  return rows
}

const rows = parseCSV(csv)
const headers = rows[0]
const data = rows.slice(1)

function parseMoney(s) {
  if (!s) return 0
  return Math.round(Number(s.replace(/[$,\s]/g, '')) || 0)
}

const teamJson = JSON.parse(readFileSync('data/team.json', 'utf8'))

function findTeamMember(name) {
  const lower = name.toLowerCase()
  return teamJson.find(m => m.name.toLowerCase() === lower)
}

// Map name variations
const NAME_MAP = {
  'Anthony Murphy': 'Tony Murphy',
  'Maria Sanchez Mallona': 'Gabbi Sanchez Mallona',
  'Lindsay Grizzard': 'Lindsay Grizzard',
}

const results = data.map(row => {
  const csvName = row[0]
  const displayName = NAME_MAP[csvName] || csvName
  const member = findTeamMember(displayName)

  const currentBase = parseMoney(row[15])
  const newBase = parseMoney(row[18])
  const newTotalCompY1 = parseMoney(row[25])
  const newTotalCompY2 = parseMoney(row[26])
  const perfScore = row[11] || ''
  const promotion = (row[13] || '').toLowerCase() === 'yes'
  const newEquityTotal = parseMoney(row[29])

  let currentTotalComp = 0
  if (member) {
    const latest = member.compensation[member.compensation.length - 1]
    if (latest) currentTotalComp = latest.total_comp
  }

  return {
    name: displayName,
    level: row[3],
    zone: row[6],
    perf_score: perfScore,
    promotion,
    current_base: currentBase,
    new_base: newBase,
    current_total_comp: currentTotalComp,
    new_total_comp: newTotalCompY1,
    new_total_comp_y2: newTotalCompY2,
    new_equity_total: newEquityTotal,
  }
}).filter(r => r.current_base > 0)

writeFileSync('data/comp_planning.json', JSON.stringify(results, null, 2))
console.log(`Wrote ${results.length} records to data/comp_planning.json`)
results.forEach(r => {
  const baseDelta = r.new_base - r.current_base
  const basePct = r.current_base ? ((baseDelta / r.current_base) * 100).toFixed(1) : '?'
  console.log(`  ${r.name}: base ${r.current_base} -> ${r.new_base} (${basePct}%), total ${r.current_total_comp} -> ${r.new_total_comp}`)
})
