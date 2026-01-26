/**
 * Settings 用例
 */

import type { SettingsPort } from '@contracts/ports'
import type { SettingsPublicDTO } from '@contracts/dto'

export interface GetPublicSettingsInput {
  settingsPort: SettingsPort
}

export async function getPublicSettings(
  input: GetPublicSettingsInput
): Promise<SettingsPublicDTO> {
  return input.settingsPort.getPublicSettings()
}
