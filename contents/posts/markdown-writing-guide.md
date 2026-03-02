---
title: 'Markdown 写作指南：Tsuki 支持的全部语法与扩展'
summary: '从基础 Markdown 到 KaTeX 数学公式、代码高亮、可折叠代码块——Tsuki 支持的所有写作功能完整演示。'
publishedAt: '2026-01-01'
category: '教程'
series: 'Tsuki 上手指南'
tags: ['Markdown', '写作', 'KaTeX', '代码高亮']
cover: './contents/banners/3.png'
pinned: false
---

Tsuki 使用 Astro 的 Markdown 渲染管线，并通过多个插件扩展了标准语法。这篇文章以实例演示你在 Tsuki 中可以使用的所有写作功能。

## 一、文章 Frontmatter

每篇文章以 YAML frontmatter 开头，定义元数据：

```yaml
---
title: '文章标题'
summary: '文章摘要，显示在列表页 and SEO 描述中。'
publishedAt: '2026-01-01'
category: '分类名'
series: '系列名'
tags: ['标签1', '标签2']
cover: './contents/banners/1.png'
pinned: true
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `summary` | ✅ | 摘要，用于列表卡片和 `<meta description>` |
| `publishedAt` | ✅ | 发布日期，格式 `YYYY-MM-DD` |
| `category` | ❌ | 分类（每篇文章只能有一个分类） |
| `series` | ❌ | 系列名（用于将多篇文章归入同一系列） |
| `tags` | ❌ | 标签列表（字符串数组） |
| `cover` | ❌ | 封面图路径，支持本地路径或 URL |
| `pinned` | ❌ | 是否置顶显示，默认 `false` |

## 二、基础 Markdown 语法

### 标题

```markdown
## 二级标题
### 三级标题
#### 四级标题
```

建议文章从二级标题开始（一级标题被文章标题占用）。

### 文本格式

```markdown
**粗体** 和 *斜体* 以及 ~~删除线~~

> 引用块可以嵌套
> > 这是嵌套引用
```

**粗体** 和 *斜体* 以及 ~~删除线~~

> 引用块可以嵌套
> > 这是嵌套引用

### 列表

```markdown
- 无序列表项
- 第二项
  - 嵌套项

1. 有序列表
2. 第二项
   1. 嵌套有序项
```

- 无序列表项
- 第二项
  - 嵌套项

1. 有序列表
2. 第二项
   1. 嵌套有序项

### 表格

```markdown
| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| 内容   | 内容 |   内容 |
| 长一些的内容 | 短 | 123 |
```

| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| 内容   | 内容 |   内容 |
| 长一些的内容 | 短 | 123 |

### 链接与图片

```markdown
[链接文本](https://example.com)

![图片说明](./contents/banners/1.png)
```

> 💡 本地图片路径相对于项目根目录。构建时，图片会自动转换为 AVIF 格式以优化加载速度。

### 分隔线

```markdown
---
```

---

## 三、代码高亮（Expressive Code）

Tsuki 使用 [Expressive Code](https://expressive-code.com/) 提供高级代码块渲染，支持行号、高亮行、文件名标注等功能。

### 基础代码块

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```
````

渲染效果：

```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```

### 带文件名的代码块

````markdown
```typescript title="src/utils/format.ts"
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```
````

```typescript title="src/utils/format.ts"
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```

### 高亮特定行

使用 `{数字}` 标记高亮行：

````markdown
```python {2,4}
def fibonacci(n):
    if n <= 1:        # 这行会高亮
        return n
    return fibonacci(n-1) + fibonacci(n-2)  # 这行也会高亮
```
````

```python {2,4}
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

### 插入和删除标记

使用 `ins` 和 `del` 标记插入和删除行，非常适合展示代码变更：

````markdown
```js ins={3} del={2}
const config = {
  theme: 'light',
  theme: 'dark',
}
```
````

```js ins={3} del={2}
const config = {
  theme: 'light',
  theme: 'dark',
}
```

### 可折叠代码段

对于长代码块，可以使用折叠功能：

````markdown
```rust collapse={3-8}
fn main() {
    // 初始化配置（可以折叠）
    let config = Config::new();
    let db = Database::connect(&config.db_url);
    let cache = Cache::new(config.cache_size);
    let logger = Logger::init(&config.log_level);
    let metrics = Metrics::new();
    let tracer = Tracer::new(&config.trace_endpoint);

    // 主逻辑
    let server = Server::new(config, db, cache);
    server.run();
}
```
````

```rust collapse={3-8}
fn main() {
    // 初始化配置（可以折叠）
    let config = Config::new();
    let db = Database::connect(&config.db_url);
    let cache = Cache::new(config.cache_size);
    let logger = Logger::init(&config.log_level);
    let metrics = Metrics::new();
    let tracer = Tracer::new(&config.trace_endpoint);

    // 主逻辑
    let server = Server::new(config, db, cache);
    server.run();
}
```

## 四、数学公式（KaTeX）

Tsuki 通过 `remark-math` + `rehype-katex` 支持 LaTeX 数学公式渲染。

### 行内公式

使用单个 `$` 包裹：

```markdown
爱因斯坦的质能方程 $E = mc^2$ 揭示了质量与能量的等价关系。
```

爱因斯坦的质能方程 $E = mc^2$ 揭示了质量与能量的等价关系。

### 块级公式

使用双 `$$` 包裹：

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### 更多数学示例

矩阵：

$$
A = \begin{pmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{pmatrix}
$$

## 五、任务列表

```markdown
- [x] 已完成的任务
- [ ] 待完成的任务
```

- [x] 已完成的任务
- [ ] 待完成的任务

## 六、HTML 内嵌

```html
<details>
<summary>点击展开更多内容</summary>

支持 Markdown。

</details>
```

<details>
<summary>点击展开更多内容</summary>

支持 Markdown。

</details>

## 七、图片优化管线

Tsuki 在构建时会自动处理所有图片：

1. **格式转换**：自动转换为 AVIF 格式
2. **懒加载**：默认使用 `loading="lazy"`
3. **灯箱效果**：点击文章内图片可以全屏预览

---

以上就是 Tsuki 支持的全部写作功能。
