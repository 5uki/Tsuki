import { describe, it, expect } from 'vitest'
import { formatRelativeTime, formatDate, formatDateTime } from '@tsuki/shared/time'
import type { TimeDTO } from '@tsuki/shared/dto'

describe('time', () => {
  const createTime = (ts: number): TimeDTO => ({
    ts,
    iso: new Date(ts).toISOString(),
  })

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent times', () => {
      const now = Date.now()
      const time = createTime(now - 30 * 1000) // 30 seconds ago
      expect(formatRelativeTime(time, now)).toBe('刚刚')
    })

    it('should return minutes ago', () => {
      const now = Date.now()
      const time = createTime(now - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(time, now)).toBe('5 分钟前')
    })

    it('should return hours ago', () => {
      const now = Date.now()
      const time = createTime(now - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatRelativeTime(time, now)).toBe('3 小时前')
    })

    it('should return days ago', () => {
      const now = Date.now()
      const time = createTime(now - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      expect(formatRelativeTime(time, now)).toBe('7 天前')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const time = createTime(new Date('2026-01-18').getTime())
      expect(formatDate(time)).toBe('2026-01-18')
    })
  })

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const time = createTime(new Date('2026-01-18T14:30:00').getTime())
      expect(formatDateTime(time)).toBe('2026-01-18 14:30')
    })
  })
})
