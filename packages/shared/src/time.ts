/**
 * 共享时间工具
 */

import type { TimeDTO } from './dto'

/**
 * 创建 TimeDTO
 */
export function createTimeDTO(timestamp: number = Date.now()): TimeDTO {
  return {
    ts: timestamp,
    iso: new Date(timestamp).toISOString(),
  }
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(time: TimeDTO, now: number = Date.now()): string {
  const diff = now - time.ts
  const absDiff = Math.abs(diff)
  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (diff < 0) {
    if (seconds < 60) return '即将'
    if (minutes < 60) return `${minutes} 分钟后`
    if (hours < 24) return `${hours} 小时后`
    if (days < 30) return `${days} 天后`
    return formatDate(time)
  }

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 30) return `${days} 天前`
  return formatDate(time)
}

/**
 * 格式化日期
 */
export function formatDate(time: TimeDTO): string {
  const date = new Date(time.ts)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化完整时间
 */
export function formatDateTime(time: TimeDTO): string {
  const date = new Date(time.ts)
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(time)} ${hours}:${mins}`
}
