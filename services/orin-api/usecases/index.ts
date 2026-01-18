/**
 * L3 Usecases Layer - 业务用例层
 *
 * 职责：
 * - 业务用例/流程编排
 * - 调用顺序、事务边界、幂等、超时/重试策略
 * - 跨步骤数据流组织
 *
 * 约束：
 * - 依赖仅允许：atoms/、contracts/、usecases/_shared/
 * - 禁止用例之间相互调用
 * - 禁止直接依赖/导入 adapters/
 */

export * from './settings'
