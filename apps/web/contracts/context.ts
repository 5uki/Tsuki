/**
 * 应用上下文类型定义
 */

import type { ApiAdapter } from '@adapters/api'
import type { StorageAdapter } from '@adapters/storage'

export interface AppContext {
  api: ApiAdapter
  storage: StorageAdapter
}
