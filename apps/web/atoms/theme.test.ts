import { describe, it, expect } from 'vitest'
import { isValidTheme, getSafeTheme, THEMES, DEFAULT_THEME } from '@atoms/theme'

describe('theme', () => {
  describe('THEMES', () => {
    it('should have 7 themes', () => {
      expect(THEMES.length).toBe(7)
      expect(THEMES).toContain('paper')
      expect(THEMES).toContain('ink')
      expect(THEMES).toContain('nord')
      expect(THEMES).toContain('rose')
      expect(THEMES).toContain('aurora')
      expect(THEMES).toContain('mono')
      expect(THEMES).toContain('violet')
    })
  })

  describe('isValidTheme', () => {
    it('should return true for valid themes', () => {
      expect(isValidTheme('paper')).toBe(true)
      expect(isValidTheme('ink')).toBe(true)
    })

    it('should return false for invalid themes', () => {
      expect(isValidTheme('invalid')).toBe(false)
      expect(isValidTheme('')).toBe(false)
    })
  })

  describe('getSafeTheme', () => {
    it('should return valid theme', () => {
      expect(getSafeTheme('ink')).toBe('ink')
    })

    it('should return default for invalid input', () => {
      expect(getSafeTheme('invalid')).toBe(DEFAULT_THEME)
      expect(getSafeTheme(null)).toBe(DEFAULT_THEME)
      expect(getSafeTheme(undefined)).toBe(DEFAULT_THEME)
    })
  })
})
