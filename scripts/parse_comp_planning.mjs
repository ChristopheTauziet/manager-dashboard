import { readFileSync, writeFileSync } from 'fs'

const csv = readFileSync('/Users/ctauziet/Downloads/Employee Data - 2025 Year End Cycle - 2026-03-16 (2).csv', 'utf8')

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

function col(name) {
  const idx = headers.findIndex(h => h.includes(name))
  if (idx === -1) console.warn(`Column not found: "${name}"`)
  return idx
}

function parseMoney(s) {
  if (!s) return 0
  return Math.round(Number(s.replace(/[$,\s]/g, '')) || 0)
}

const teamJson = JSON.parse(readFileSync('data/team.json', 'utf8'))

function findTeamMember(name) {
  const lower = name.toLowerCase()
  return teamJson.find(m => m.name.toLowerCase() === lower)
}

const NAME_MAP = {
  'Anthony Murphy': 'Tony Murphy',
  'Maria Sanchez Mallona': 'Gabbi Sanchez Mallona',
  'Lindsay Grizzard': 'Lindsay Grizzard',
}

const COL_EMPLOYEE = col('Employee')
const COL_LEVEL = col('Level')
const COL_ZONE = col('Zone')
const COL_PERF = col('YE25 Performance Score')
const COL_PROMO = col('YE25 Promotion Decision')
const COL_CURRENT_BASE = col('Current Base Pay')
const COL_NEW_BASE = col('New Base Pay')
const COL_Y1_TOTAL = headers.findIndex(h => h.startsWith('New Total Annual Compensation Apr') && h.includes('26 to Mar\'27'))
const COL_Y2_TOTAL = col('Target Compensation')
const COL_EQUITY = col('New Equity Award Total Value')

console.log(`Column indices: Y1=${COL_Y1_TOTAL}, Y2=${COL_Y2_TOTAL}`)

const results = data.map(row => {
  const csvName = row[COL_EMPLOYEE]
  const displayName = NAME_MAP[csvName] || csvName
  const member = findTeamMember(displayName)

  const currentBase = parseMoney(row[COL_CURRENT_BASE])
  const newBase = parseMoney(row[COL_NEW_BASE])
  const newTotalCompY1 = parseMoney(row[COL_Y1_TOTAL])
  const newTotalCompY2 = parseMoney(row[COL_Y2_TOTAL])
  const perfScore = row[COL_PERF] || ''
  const promotion = (row[COL_PROMO] || '').toLowerCase() === 'yes'
  const newEquityTotal = parseMoney(row[COL_EQUITY])

  let currentTotalComp = 0
  if (member) {
    const latest = member.compensation[member.compensation.length - 1]
    if (latest) currentTotalComp = latest.total_comp
  }

  return {
    name: displayName,
    level: row[COL_LEVEL],
    zone: row[COL_ZONE],
    perf_score: perfScore,
    promotion,
    current_base: currentBase,
    new_base: newBase,
    current_total_comp: currentTotalComp,
    new_total_comp: newTotalCompY1,
    new_total_comp_y2: newTotalCompY2,
    new_equity_total: newEquityTotal,
    top_performer: member?.top_performer ?? false,
  }
}).filter(r => r.current_base > 0)

writeFileSync('data/comp_planning.json', JSON.stringify(results, null, 2))
console.log(`Wrote ${results.length} records to data/comp_planning.json`)
results.forEach(r => {
  const baseDelta = r.new_base - r.current_base
  const basePct = r.current_base ? ((baseDelta / r.current_base) * 100).toFixed(1) : '?'
  console.log(`  ${r.name}: base ${r.current_base} -> ${r.new_base} (${basePct}%), total ${r.current_total_comp} -> ${r.new_total_comp}`)
})
