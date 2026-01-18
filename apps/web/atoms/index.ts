/**
 * L4 Atoms Layer - 纯逻辑原子层
 *
 * 职责：
 * - 纯函数/纯逻辑
 * - 无 I/O
 * - 可单元测试
 *
 * 约束：
 * - 单个原子建议 ≤ 80 行
 * - 原子之间可互相调用（保持纯逻辑）
 */

export * from './time'
export * from './theme'
