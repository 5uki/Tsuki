/**
 * L4 Atoms Layer - 纯逻辑原子层
 *
 * 职责：
 * - 单一职责的最小纯能力单元
 * - 无 I/O、无共享可变状态
 * - 可单元测试、可复用
 *
 * 约束：
 * - 单个原子建议 ≤ 80 行
 * - 原子之间可互相调用（保持纯逻辑）
 */

export * from './slug'
export * from './time'
export * from './hash'
