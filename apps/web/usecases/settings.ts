/**
 * 站点配置相关用例
 */

import type { AppContext } from '@contracts/context'
import type { SettingsPublicDTO } from '@contracts/dto'

/**
 * 获取公开站点配置
 */
export async function getPublicSettings(ctx: AppContext): Promise<SettingsPublicDTO> {
  return ctx.api.getPublicSettings()
}
