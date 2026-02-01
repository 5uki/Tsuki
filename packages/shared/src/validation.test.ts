import { describe, expect, it } from 'vitest'

import { isValidSlug, isValidUUID, normalizeSlug, normalizeString, parsePaginationParams } from './validation'

describe('validation', () => {
  it('isValidSlug 按规则校验', () => {
    expect(isValidSlug('a')).toBe(true)
    expect(isValidSlug('a-1-b')).toBe(true)

    expect(isValidSlug('A')).toBe(false)
    expect(isValidSlug('a_1')).toBe(false)
    expect(isValidSlug('-a')).toBe(false)
    expect(isValidSlug('a-')).toBe(false)
    expect(isValidSlug('a--b')).toBe(false)
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug('a'.repeat(65))).toBe(false)
  })

  it('normalizeSlug 会 trim + lowerCase', () => {
    expect(normalizeSlug('  AbC-1  ')).toBe('abc-1')
  })

  it('normalizeString 会 trim', () => {
    expect(normalizeString('  hello  ')).toBe('hello')
  })

  it('parsePaginationParams 会限制 limit 并读取 cursor', () => {
    const params = new URLSearchParams({ limit: '999', cursor: 'abc' })
    const parsed = parsePaginationParams(params)
    expect(parsed.limit).toBe(50)
    expect(parsed.cursor).toBe('abc')
  })

  it('isValidUUID 校验 v4 格式', () => {
    expect(isValidUUID('8f5f6e3a-2d1b-4c3d-9a2b-1f2e3d4c5b6a')).toBe(true)
    expect(isValidUUID('8f5f6e3a-2d1b-3c3d-9a2b-1f2e3d4c5b6a')).toBe(false)
  })
})

