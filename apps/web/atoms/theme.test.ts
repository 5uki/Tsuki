import { describe, it, expect } from 'vitest'
import { isValidTheme, getSafeTheme, THEMES, DEFAULT_THEME } from '@atoms/theme'

describe('theme', () => {
  describe('THEMES', () => {
    it('should only keep mauve theme', () => {
      expect(THEMES).toEqual(['mauve'])
      expect(DEFAULT_THEME).toBe('mauve')
    })
  })

  describe('isValidTheme', () => {
    it('should return true for mauve', () => {
      expect(isValidTheme('mauve')).toBe(true)
    })

    it('should return false for removed themes', () => {
      expect(isValidTheme('paper')).toBe(false)
      expect(isValidTheme('ink')).toBe(false)
      expect(isValidTheme('invalid')).toBe(false)
    })
  })

  describe('getSafeTheme', () => {
    it('should return mauve for valid input', () => {
      expect(getSafeTheme('mauve')).toBe('mauve')
    })

    it('should return default for invalid input', () => {
      expect(getSafeTheme('invalid')).toBe(DEFAULT_THEME)
      expect(getSafeTheme(null)).toBe(DEFAULT_THEME)
      expect(getSafeTheme(undefined)).toBe(DEFAULT_THEME)
    })
  })
})
