/**
 * X1 Contracts - 契约区
 *
 * 职责：
 * - DTO/请求响应类型
 * - 错误码
 * - 端口接口（ports）
 * - 常量
 *
 * 约束：
 * - 只声明不实现
 * - 不得包含业务流程或 I/O 代码
 */

export * from './dto'
export * from './errors'
export * from './content'
export * from './context'
export * from './ports'
