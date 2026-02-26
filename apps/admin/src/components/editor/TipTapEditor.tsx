import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useCallback, useRef } from 'react'
import { uploadMedia } from '@/api/media'

interface TipTapEditorProps {
  content: string
  onChange: (markdown: string) => void
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown()
      onChange(md)
    },
  })

  const handleImageUpload = useCallback(async () => {
    fileInputRef.current?.click()
  }, [])

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]!
      try {
        const { path } = await uploadMedia(file.name, base64)
        editor.chain().focus().setImage({ src: `/${path}` }).run()
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [editor])

  if (!editor) return null

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="标题"
        >H2</button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="子标题"
        >H3</button>
        <span className="toolbar-sep" />
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="粗体"
        >B</button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >I</button>
        <span className="toolbar-sep" />
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="无序列表"
        >UL</button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="有序列表"
        >OL</button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >Q</button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="代码块"
        >{'</>'}</button>
        <span className="toolbar-sep" />
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => {
            const url = window.prompt('链接地址:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          title="链接"
        >🔗</button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleImageUpload}
          title="图片"
        >🖼</button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >—</button>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileSelected}
      />
    </div>
  )
}
