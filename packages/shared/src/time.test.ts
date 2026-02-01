import { describe, expect, it } from 'vitest'

import { createTimeDTO, formatDate, formatDateTime, formatRelativeTime } from './time'

describe('time', () => {
  it('createTimeDTO 生成 ts/iso', () => {
    const time = createTimeDTO(0)
    expect(time.ts).toBe(0)
    expect(time.iso).toBe('1970-01-01T00:00:00.000Z')
  })

  it('formatDate 与 formatDateTime 按本地时间格式化', () => {
    const time = createTimeDTO(0)
    expect(formatDate(time)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(formatDateTime(time)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('formatRelativeTime 处理过去与未来', () => {
    const now = 1_000_000
    expect(formatRelativeTime(createTimeDTO(now), now)).toBe('刚刚')
    expect(formatRelativeTime(createTimeDTO(now + 30_000), now)).toBe('即将')
  })
})

