/**
 * X2 Adapters - 适配器区
 *
 * 职责：
 * - 系统唯一允许出现 I/O 的区域
 * - fetch、localStorage、cookie 等
 *
 * 约束：
 * - 禁止依赖 usecases 与 api
 * - 禁止承载业务规则
 */

export * from './api'
export * from './storage'
