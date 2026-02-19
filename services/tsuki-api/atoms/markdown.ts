/**
 * 评论 Markdown 渲染原子
 * v1 简单实现：HTML 转义 + 换行处理 + URL 自动链接
 *
 * 约束（MD2/MD3）：
 * - 禁止图片语法
 * - 禁止原始 HTML
 * - 链接仅允许 http/https/mailto
 */

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * 自动将 URL 转为链接
 * 仅允许 http:// https:// mailto:
 */
function autoLink(text: string): string {
  // 匹配 http/https URL
  const urlPattern = /https?:\/\/[^\s<>&"')\]]+/g
  // 匹配 mailto:
  const mailtoPattern = /mailto:[^\s<>&"')\]]+/g

  let result = text
  result = result.replace(urlPattern, (url) => {
    return `<a href="${url}" rel="nofollow noopener noreferrer" target="_blank">${url}</a>`
  })
  result = result.replace(mailtoPattern, (url) => {
    const display = url.replace('mailto:', '')
    return `<a href="${url}">${display}</a>`
  })

  return result
}

/**
 * 渲染评论 Markdown 为 HTML
 * - HTML 转义（防 XSS）
 * - 换行转 <br>
 * - URL 自动链接（仅 http/https/mailto）
 * - 简单加粗/斜体/行内代码支持
 */
export function renderCommentMarkdown(markdown: string): string {
  // 1. 转义 HTML
  let html = escapeHtml(markdown)

  // 2. 行内代码（在 autoLink 之前处理，避免代码内的 URL 被链接化）
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 3. URL 自动链接（在代码块内的不处理，但简单实现先整体替换）
  html = autoLink(html)

  // 4. 加粗 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 5. 斜体 *text*（注意不匹配已被加粗的）
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // 6. 换行转 <br>
  html = html.replace(/\n/g, '<br>')

  // 7. 包裹段落
  return `<p>${html}</p>`
}
