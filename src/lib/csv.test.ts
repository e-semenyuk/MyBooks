import { describe, expect, it } from 'vitest'
import { parseCsv, safeCell, toCsv, unsafeCell, CsvError } from './csv'

describe('parseCsv', () => {
  it('parses simple rows with LF and CRLF', () => {
    expect(parseCsv('a,b\n1,2\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']])
  })
  it('handles quotes, commas, doubled quotes and line breaks inside quotes', () => {
    expect(parseCsv('t,d\n"Hello, world","say ""hi""\nbye"')).toEqual([['t', 'd'], ['Hello, world', 'say "hi"\nbye']])
  })
  it('keeps empty cells and skips blank lines', () => {
    expect(parseCsv('a,,c\n\n,,\n')).toEqual([['a', '', 'c'], ['', '', '']])
  })
  it('drops a byte order mark', () => {
    expect(parseCsv('﻿a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })
  it('rejects an unclosed quote', () => {
    expect(() => parseCsv('a,"b\n1,2')).toThrow(CsvError)
  })
})

describe('formula protection', () => {
  it('prefixes cells that start like formulas', () => {
    for (const bad of ['=1+1', '+1', '-1', '@x', '\tx']) expect(safeCell(bad)).toBe(`'${bad}`)
    expect(safeCell('Dune')).toBe('Dune')
  })
  it('does not touch numbers, including negative ones', () => {
    expect(safeCell(-5)).toBe('-5')
    expect(safeCell(12.99)).toBe('12.99')
  })
  it('round-trips through unsafeCell', () => {
    expect(unsafeCell(safeCell('=SUM(A1)'))).toBe('=SUM(A1)')
    expect(unsafeCell("'quoted")).toBe("'quoted")
  })
})

describe('toCsv', () => {
  it('escapes and round-trips', () => {
    const rows = [['id', 'title'], [1, 'He said "no", twice'], [2, 'line\nbreak'], [3, '=cmd']]
    const parsed = parseCsv(toCsv(rows))
    expect(parsed[1]).toEqual(['1', 'He said "no", twice'])
    expect(parsed[2]).toEqual(['2', 'line\nbreak'])
    expect(unsafeCell(parsed[3][1])).toBe('=cmd')
  })
})
