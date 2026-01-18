/**
 * L2 API Layer - 前端协议层
 *
 * 职责：
 * - 入参解析（URL params、query、form）
 * - 校验与标准化
 * - 错误映射
 *
 * 禁止：
 * - 任何业务判断（是否允许/是否发布/是否可见）
 */

export * from './validation'
