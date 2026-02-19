/** 从 Markdown 原文计算字数（中文按字符计，英文按空格分词） */
export function countWords(markdown: string): number {
  // 去掉代码块
  let text = markdown.replace(/```[\s\S]*?```/g, '')
  // 去掉行内代码
  text = text.replace(/`[^`]*`/g, '')
  // 去掉图片和链接语法
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  text = text.replace(/\[[^\]]*\]\([^)]*\)/g, (m) => m.replace(/\[|\]|\([^)]*\)/g, ''))
  // 去掉 HTML 标签
  text = text.replace(/<[^>]+>/g, '')
  // 去掉 markdown 标记符号
  text = text.replace(/[#*_~>|`\-=+]/g, ' ')

  // 中文字符
  const chinese = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []
  // 去掉中文后统计英文单词
  const withoutChinese = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
  const english = withoutChinese.split(/\s+/).filter((w) => w.length > 0)

  return chinese.length + english.length
}
