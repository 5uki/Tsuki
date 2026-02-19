/**
 * 主题初始化（浏览器端）
 *
 * 从 localStorage 读取用户主题偏好，回退到默认主题，
 * 在首屏绘制前设置 data-theme 属性以减少闪烁。
 */

import { getSafeTheme } from '@tsuki/shared/theme'
import { getTheme } from './storage'

const defaultTheme = document.documentElement.dataset.defaultTheme
const persistedTheme = getTheme()

const theme = getSafeTheme(persistedTheme ?? defaultTheme)
document.documentElement.setAttribute('data-theme', theme)
