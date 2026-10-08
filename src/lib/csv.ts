// Pure CSV helpers (RFC 4180) for the book import and export (XPANBFLFA-129).

// Parses CSV text into rows of cells. Handles quotes, doubled quotes, commas
// and line breaks inside quotes, CRLF and a leading byte order mark.
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        quoted = false
      } else {
        cell += c
      }
    } else if (c === '"' && cell === '') {
      quoted = true
    } else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += c
    }
    i++
  }
  if (quoted) throw new CsvError('A quoted value is not closed')
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  // A blank line is not a row
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

export class CsvError extends Error {}

const FORMULA_START = /^[=+\-@\t\r]/

// Spreadsheets run cells that start with = + - @ as formulas. Text is
// prefixed with an apostrophe so exported data cannot execute.
export function safeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return typeof value === 'string' && FORMULA_START.test(text) ? `'${text}` : text
}

// Undoes safeCell when a file is imported again.
export function unsafeCell(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value
}

function escapeCell(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map((cell) => escapeCell(safeCell(cell))).join(',')).join('\r\n') + '\r\n'
}
