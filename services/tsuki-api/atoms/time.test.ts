import { describe, it, expect } from 'vitest'
import { createTimeDTO, now, calculateReadingTime } from './time'

describe('time', () => {
  describe('createTimeDTO', () => {
    it('should create TimeDTO with correct format', () => {
      const ts = 1737203696789
      const dto = createTimeDTO(ts)

      expect(dto.ts).toBe(ts)
      expect(dto.iso).toBe('2025-01-18T12:34:56.789Z')
    })
  })

  describe('now', () => {
    it('should return current time', () => {
      const before = Date.now()
      const dto = now()
      const after = Date.now()

      expect(dto.ts).toBeGreaterThanOrEqual(before)
      expect(dto.ts).toBeLessThanOrEqual(after)
      expect(dto.iso).toBeTruthy()
    })
  })

  describe('calculateReadingTime', () => {
    it('should calculate reading time based on 400 chars/min', () => {
      expect(calculateReadingTime('a'.repeat(400))).toBe(1)
      expect(calculateReadingTime('a'.repeat(401))).toBe(2)
      expect(calculateReadingTime('a'.repeat(800))).toBe(2)
      expect(calculateReadingTime('a'.repeat(1200))).toBe(3)
    })

    it('should ignore whitespace', () => {
      const text = 'a '.repeat(400)
      expect(calculateReadingTime(text)).toBe(1)
    })

    it('should return 1 for very short text', () => {
      expect(calculateReadingTime('hello')).toBe(1)
    })
  })
})
