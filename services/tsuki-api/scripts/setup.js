#!/usr/bin/env node

/**
 * Tsuki 一键部署脚本
 *
 * 功能：
 * 1. 检查 wrangler 登录状态
 * 2. 创建/查找 D1 数据库
 * 3. 更新 wrangler.toml 中的 database_id
 * 4. 执行 D1 迁移
 * 5. 部署 Worker（自动注入 GITHUB_REPO_OWNER/NAME）
 * 6. 构建并部署 Pages
 * 7. 输出 /setup URL
 *
 * 使用方式：
 *   pnpm run setup          # 完整部署（Worker + Pages）
 *   pnpm run setup:worker   # 只部署 Worker
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const API_DIR = join(__dirname, '..')
const ROOT_DIR = join(API_DIR, '..', '..')
const WRANGLER_TOML = join(API_DIR, 'wrangler.toml')

const workerOnly = process.argv.includes('--worker-only')

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', cwd: API_DIR, ...opts }).trim()
}

function runInherit(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: API_DIR, ...opts })
}

function log(icon, msg) {
  console.log(`${icon} ${msg}`)
}

// ─────────────────────────────────────────
console.log('')
log('🌙', '========================================')
log('  ', ' Tsuki 一键部署')
log('  ', '========================================')
console.log('')

// Step 1: 检查 wrangler 登录状态
log('🔑', 'Step 1: 检查 Cloudflare 认证...')
try {
  run('pnpm exec wrangler whoami')
  log('✅', '已登录 Cloudflare')
} catch {
  log('⚠️ ', '未登录 Cloudflare，正在打开登录...')
  runInherit('pnpm exec wrangler login')
}
console.log('')

// Step 2: 创建/查找 D1 数据库
log('🗄️', 'Step 2: 设置 D1 数据库...')
let dbId = ''

try {
  const listOutput = run('pnpm exec wrangler d1 list --json 2>/dev/null')
  const databases = JSON.parse(listOutput)
  const existing = databases.find((db) => db.name === 'tsuki_db')
  if (existing) {
    dbId = existing.uuid
    log('✅', `找到已有数据库: tsuki_db (${dbId})`)
  }
} catch {
  // ignore parse errors
}

if (!dbId) {
  log('📦', '创建新数据库 tsuki_db...')
  const createOutput = run('pnpm exec wrangler d1 create tsuki_db 2>&1')
  const match = createOutput.match(/database_id\s*=\s*"([^"]+)"/)
  if (match) {
    dbId = match[1]
    log('✅', `数据库已创建: ${dbId}`)
  } else {
    console.error('❌ 无法创建 D1 数据库，输出:')
    console.error(createOutput)
    process.exit(1)
  }
}
console.log('')

// Step 3: 更新 wrangler.toml
log('📝', 'Step 3: 更新 wrangler.toml...')
const originalToml = readFileSync(WRANGLER_TOML, 'utf-8')
let modifiedToml = originalToml

if (originalToml.includes('placeholder-replace-with-actual-id')) {
  modifiedToml = originalToml.replace('placeholder-replace-with-actual-id', dbId)
  writeFileSync(WRANGLER_TOML, modifiedToml, 'utf-8')
  log('✅', `database_id 已更新: ${dbId}`)
} else if (!originalToml.includes(dbId)) {
  // 已有其他 id，替换之
  modifiedToml = originalToml.replace(/database_id = "[^"]*"/, `database_id = "${dbId}"`)
  writeFileSync(WRANGLER_TOML, modifiedToml, 'utf-8')
  log('✅', `database_id 已更新: ${dbId}`)
} else {
  log('✅', 'database_id 已是最新')
}
console.log('')

// Step 4: 执行 D1 迁移
log('🔄', 'Step 4: 执行数据库迁移...')
try {
  runInherit('pnpm exec wrangler d1 migrations apply tsuki_db --remote')
  log('✅', '迁移完成')
} catch (err) {
  console.error('❌ 迁移失败')
  // 恢复 wrangler.toml（如果我们改了它）
  writeFileSync(WRANGLER_TOML, originalToml, 'utf-8')
  process.exit(1)
}
console.log('')

// Step 5: 自动检测 GitHub 仓库信息
log('🔍', 'Step 5: 检测 GitHub 仓库信息...')
let repoOwner = ''
let repoName = ''

try {
  const remoteUrl = run('git remote get-url origin', { cwd: ROOT_DIR })
  // 支持 SSH (git@github.com:user/repo.git) 和 HTTPS (https://github.com/user/repo.git)
  const sshMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  if (sshMatch) {
    repoOwner = sshMatch[1]
    repoName = sshMatch[2]
  }
} catch {
  // git 不可用或没有 remote
}

if (repoOwner && repoName) {
  log('✅', `仓库: ${repoOwner}/${repoName}`)
} else {
  log('⚠️ ', '无法自动检测仓库信息，跳过 GITHUB_REPO_OWNER/NAME 注入')
}
console.log('')

// Step 6: 部署 Worker
log('🚀', 'Step 6: 部署 Worker...')
try {
  const varArgs = []
  if (repoOwner) varArgs.push(`--var GITHUB_REPO_OWNER:${repoOwner}`)
  if (repoName) varArgs.push(`--var GITHUB_REPO_NAME:${repoName}`)

  const deployCmd = `pnpm exec wrangler deploy ${varArgs.join(' ')}`
  const deployOutput = run(deployCmd)
  console.log(deployOutput)

  // 提取 Worker URL
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.workers\.dev/)
  const workerUrl = urlMatch ? urlMatch[0] : null

  if (workerUrl) {
    log('✅', `Worker 已部署: ${workerUrl}`)
  } else {
    log('✅', 'Worker 已部署')
  }
  console.log('')

  // Step 7: 构建并部署 Pages
  if (!workerOnly) {
    log('🏗️', 'Step 7: 构建前端...')
    const buildEnv = workerUrl
      ? { ...process.env, PUBLIC_TSUKI_API_BASE: `${workerUrl}/v1` }
      : process.env
    execSync('pnpm build', { stdio: 'inherit', cwd: ROOT_DIR, env: buildEnv })
    log('✅', '构建完成')
    console.log('')

    log('📤', 'Step 8: 部署 Pages...')
    execSync('pnpm exec wrangler pages deploy dist --project-name=tsuki', {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    })
    log('✅', 'Pages 已部署')
    console.log('')
  }

  // 完成
  console.log('')
  log('🌙', '========================================')
  log('  ', ' 部署完成！')
  log('  ', '========================================')
  console.log('')
  if (workerUrl) {
    log('👉', `访问 ${workerUrl}/setup 完成首次设置`)
  } else {
    log('👉', '访问你的 Worker URL /setup 完成首次设置')
  }
  log('📖', '设置内容: GitHub OAuth App + 管理员 ID')
  console.log('')
} catch (err) {
  console.error('❌ 部署失败')
  console.error(err.message)
  process.exit(1)
}
