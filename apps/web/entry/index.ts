/**
 * L1 Entry Layer - 前端启动入口与装配根
 *
 * 职责：
 * - SSR 入口配置
 * - 全局依赖装配（DI）
 * - 生命周期管理
 *
 * 禁止：
 * - 实现任何业务逻辑
 */

import type { AppContext } from '@contracts/context'
import { createApiAdapter } from '@adapters/api'
import { createStorageAdapter } from '@adapters/storage'

export function createAppContext(): AppContext {
  const apiBase = import.meta.env.PUBLIC_TSUKI_API_BASE || 'http://localhost:8787/v1'

  return {
    api: createApiAdapter(apiBase),
    storage: createStorageAdapter(),
  }
}
