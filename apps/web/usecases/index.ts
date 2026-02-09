/**
 * L3 Usecases Layer - 前端用例层
 *
 * 职责：
 * - 页面流程编排
 * - 调用 adapters 获取数据
 * - 组合多个操作
 *
 * 禁止：
 * - 直接进行 I/O（必须通过 adapters）
 * - 用例之间相互调用
 */

export * from './settings'
export * from './content'
