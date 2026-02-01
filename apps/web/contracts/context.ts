/**
 * 应用上下文类型定义
 */

import type { ApiPort, StoragePort } from './ports'

export interface AppContext {
  api: ApiPort
  storage: StoragePort
}
