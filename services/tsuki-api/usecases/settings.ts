/**
 * Settings 用例
 *
 * 功能概述:
 * 提供站点配置相关的业务用例,封装配置获取逻辑。
 *
 * 核心功能:
 * - getPublicSettings: 获取公开的站点配置
 *
 * 设计模式:
 * - 简单用例模式: 直接调用适配器方法,无复杂编排
 * - 接口隔离: 通过 SettingsPort 接口依赖适配器
 *
 * 使用场景:
 * - 前端获取站点配置
 * - API 返回公开配置信息
 * - 初始化站点主题和基础信息
 *
 * 性能优化点:
 * - 直接委托给适配器,无额外计算
 * - 使用接口类型,便于测试和替换
 *
 * 已知限制:
 * - 目前仅支持获取公开配置
 * - 不支持配置更新(预留接口)
 */

import type { SettingsPort } from '@contracts/ports'
import type { SettingsPublicDTO } from '@contracts/dto'

export interface GetPublicSettingsInput {
  settingsPort: SettingsPort
}

/**
 * 获取公开站点配置
 *
 * 功能说明:
 * 从配置存储中获取公开的站点配置信息。
 *
 * 实现细节:
 * - 直接调用 SettingsPort 的 getPublicSettings 方法
 * - 不做任何业务逻辑处理,仅做委托
 * - 返回配置数据传输对象(DTO)
 *
 * 参数说明:
 * - settingsPort: 设置适配器接口,提供配置访问能力
 *
 * 返回值:
 * - SettingsPublicDTO: 包含站点公开配置的数据对象
 *
 * 使用场景:
 * - 前端初始化时获取配置
 * - API 端点 /settings/public
 * - 获取站点标题、描述、默认主题等信息
 *
 * @param input - 包含 settingsPort 的输入对象
 * @returns 公开的站点配置数据
 */
export async function getPublicSettings(
  input: GetPublicSettingsInput
): Promise<SettingsPublicDTO> {
  return input.settingsPort.getPublicSettings()
}
