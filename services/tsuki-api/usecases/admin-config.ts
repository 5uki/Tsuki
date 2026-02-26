/**
 * Admin Config 用例
 * 读取站点配置和关于页面
 */

import type { GitHubRepoPort } from '@contracts/ports'
import { AppError } from '@contracts/errors'

const CONFIG_PATH = 'tsuki.config.json'
const ABOUT_PATH = 'contents/about.md'

// ─── GetSiteConfig ───

export interface GetSiteConfigInput {
  githubRepoPort: GitHubRepoPort
}

export async function getSiteConfig(input: GetSiteConfigInput): Promise<{ config: unknown; sha: string }> {
  try {
    const { content, sha } = await input.githubRepoPort.getFile(CONFIG_PATH)
    const config = JSON.parse(content)
    return { config, sha }
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError('NOT_FOUND', 'Site config not found')
  }
}

// ─── GetAboutPage ───

export interface GetAboutPageInput {
  githubRepoPort: GitHubRepoPort
}

export async function getAboutPage(input: GetAboutPageInput): Promise<{ content: string; sha: string }> {
  try {
    return await input.githubRepoPort.getFile(ABOUT_PATH)
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError('NOT_FOUND', 'About page not found')
  }
}
