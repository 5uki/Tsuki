import { describe, it, expect } from 'vitest'
import { isValidSlug, normalizeSlug } from './slug'

describe('slug', () => {
  describe('isValidSlug', () => {
    it('should accept valid slugs', () => {
      expect(isValidSlug('hello')).toBe(true)
      expect(isValidSlug('hello-world')).toBe(true)
      expect(isValidSlug('post-123')).toBe(true)
      expect(isValidSlug('a')).toBe(true)
      expect(isValidSlug('a'.repeat(64))).toBe(true)
    })

    it('should reject invalid slugs', () => {
      expect(isValidSlug('')).toBe(false)
      expect(isValidSlug('-hello')).toBe(false)
      expect(isValidSlug('hello-')).toBe(false)
      expect(isValidSlug('hello--world')).toBe(false)
      expect(isValidSlug('Hello')).toBe(false)
      expect(isValidSlug('hello world')).toBe(false)
      expect(isValidSlug('hello_world')).toBe(false)
      expect(isValidSlug('a'.repeat(65))).toBe(false)
    })
  })

  describe('normalizeSlug', () => {
    it('should convert to lowercase', () => {
      expect(normalizeSlug('HELLO')).toBe('hello')
      expect(normalizeSlug('Hello-World')).toBe('hello-world')
    })

    it('should trim whitespace', () => {
      expect(normalizeSlug('  hello  ')).toBe('hello')
    })
  })
})
