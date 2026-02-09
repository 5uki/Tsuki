/**
 * 应用上下文类型定义
 */

import type { ApiPort, ContentPort, StoragePort } from './ports'

export interface AppContext {
  api: ApiPort
  content: ContentPort
  storage: StoragePort
}
