import { describe, it, expect } from 'vitest'
import { isValidSlug, normalizeString, parsePaginationParams } from '@tsuki/shared/validation'

describe('validation', () => {
  describe('isValidSlug', () => {
    it('should accept valid slugs', () => {
      expect(isValidSlug('hello')).toBe(true)
      expect(isValidSlug('hello-world')).toBe(true)
      expect(isValidSlug('post-123')).toBe(true)
      expect(isValidSlug('a')).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(isValidSlug('')).toBe(false)
      expect(isValidSlug('-hello')).toBe(false)
      expect(isValidSlug('hello-')).toBe(false)
      expect(isValidSlug('hello--world')).toBe(false)
      expect(isValidSlug('Hello')).toBe(false)
      expect(isValidSlug('hello world')).toBe(false)
      expect(isValidSlug('a'.repeat(65))).toBe(false)
    })
  })

  describe('normalizeString', () => {
    it('should trim whitespace', () => {
      expect(normalizeString('  hello  ')).toBe('hello')
      expect(normalizeString('\n\thello\t\n')).toBe('hello')
    })
  })

  describe('parsePaginationParams', () => {
    it('should parse pagination params', () => {
      const params = new URLSearchParams('limit=10&cursor=abc')
      const result = parsePaginationParams(params)
      expect(result.limit).toBe(10)
      expect(result.cursor).toBe('abc')
    })

    it('should use defaults', () => {
      const params = new URLSearchParams()
      const result = parsePaginationParams(params)
      expect(result.limit).toBe(20)
      expect(result.cursor).toBe(null)
    })

    it('should cap limit at 50', () => {
      const params = new URLSearchParams('limit=100')
      const result = parsePaginationParams(params)
      expect(result.limit).toBe(50)
    })
  })
})
