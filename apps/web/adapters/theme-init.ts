/**
 * 主题初始化（浏览器端）
 *
 * 目标：
 * - 从 localStorage 读取用户主题偏好
 * - 回退到 SSR/配置注入的默认主题
 * - 尽量在首屏绘制前设置 `data-theme`，减少闪烁
 */

import { getSafeTheme } from '@tsuki/shared/theme'
import { createStorageAdapter } from './storage'

const storage = createStorageAdapter()

const defaultTheme = document.documentElement.dataset.defaultTheme
const persistedTheme = storage.getTheme()

const theme = getSafeTheme(persistedTheme ?? defaultTheme)
document.documentElement.setAttribute('data-theme', theme)

