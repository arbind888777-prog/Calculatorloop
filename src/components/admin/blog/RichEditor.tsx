"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Youtube from "@tiptap/extension-youtube"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import CodeBlock from "@tiptap/extension-code-block"
import { useCallback, useEffect, useImperativeHandle, forwardRef } from "react"
import { EditorToolbar } from "./EditorToolbar"

interface RichEditorProps {
  content: string
  onUpdate: (html: string) => void
  onWordCount?: (count: number) => void
  placeholder?: string
  onOpenImageModal?: () => void
  onOpenVideoModal?: () => void
}

export interface RichEditorHandle {
  __insertImage: (src: string, alt?: string) => void
  __insertYoutube: (url: string) => void
  __insertVideoHtml: (url: string) => void
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (!text) return 0
  return text.split(" ").length
}

export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor(
  { content, onUpdate, onWordCount, placeholder, onOpenImageModal, onOpenVideoModal },
  ref
) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "blog-image", loading: "lazy" },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Youtube.configure({
        HTMLAttributes: { class: "blog-video" },
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your blog post...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      CodeBlock,
    ],
    content,
    editorProps: {
      attributes: {
        style:
          "min-height: 400px; padding: 20px; outline: none; color: #e2e8f0; font-size: 14px; line-height: 1.8;",
      },
      handleDrop(view, event, _slice, moved) {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith("image/")) {
            event.preventDefault()
            uploadAndInsertImage(file, view)
            return true
          }
        }
        return false
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile()
              if (file) {
                event.preventDefault()
                uploadAndInsertImage(file, view)
                return true
              }
            }
          }
        }
        return false
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onUpdate(html)
      onWordCount?.(countWords(html))
    },
  })

  // Sync content when language changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const uploadAndInsertImage = useCallback(
    async (file: File, view: any) => {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          const { state } = view
          const pos = state.selection.from
          const node = state.schema.nodes.image.create({ src: data.url, alt: file.name })
          const tr = state.tr.insert(pos, node)
          view.dispatch(tr)
        }
      } catch (err) {
        console.error("Image upload failed:", err)
      }
    },
    []
  )

  // Expose editor commands for external use via ref (modals)
  useImperativeHandle(
    ref,
    () => ({
      __insertImage: (src: string, alt?: string) => {
        if (editor) {
          editor.chain().focus().setImage({ src, alt: alt || "" }).run()
        }
      },
      __insertYoutube: (url: string) => {
        if (editor) {
          editor.chain().focus().setYoutubeVideo({ src: url }).run()
        }
      },
      __insertVideoHtml: (url: string) => {
        if (editor) {
          const videoHtml = `<div class="blog-video"><video src="${url}" controls style="max-width:100%;border-radius:8px;"></video></div>`
          editor.chain().focus().insertContent(videoHtml).run()
        }
      },
    }),
    [editor]
  )

  if (!editor) return null

  return (
    <div
      style={{
        background: "#0f1623",
        border: "1px solid #1c2a3d",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <EditorToolbar
        editor={editor}
        onOpenImageModal={onOpenImageModal}
        onOpenVideoModal={onOpenVideoModal}
      />
      <EditorContent editor={editor} />
      <div
        style={{
          borderTop: "1px solid #1c2a3d",
          padding: "10px 14px",
          fontSize: "11px",
          color: "#7c93b3",
          background: "rgba(8,13,26,0.55)",
        }}
      >
        Paste formatted content, drop screenshots into the editor, or use the media buttons to place images and video exactly where you want them.
      </div>
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #3a4f6b;
          pointer-events: none;
          height: 0;
        }
        .tiptap h1 { font-size: 28px; font-weight: 800; margin: 20px 0 12px; color: #e2e8f0; }
        .tiptap h2 { font-size: 22px; font-weight: 700; margin: 18px 0 10px; color: #e2e8f0; }
        .tiptap h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; color: #e2e8f0; }
        .tiptap p { margin: 8px 0; }
        .tiptap ul, .tiptap ol { padding-left: 24px; margin: 8px 0; }
        .tiptap li { margin: 4px 0; }
        .tiptap blockquote {
          border-left: 3px solid #3b82f6;
          padding-left: 16px;
          margin: 12px 0;
          color: #94a3b8;
          font-style: italic;
        }
        .tiptap code {
          background: rgba(59,130,246,0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          color: #60a5fa;
        }
        .tiptap pre {
          background: #080d1a;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
          color: #e2e8f0;
        }
        .tiptap a { color: #60a5fa; text-decoration: underline; }
        .tiptap img.blog-image {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap .blog-video {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap iframe {
          max-width: 100%;
          border-radius: 8px;
          border: 1px solid #1c2a3d;
        }
        .tiptap video {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap u { text-decoration: underline; }
        .tiptap s { text-decoration: line-through; }
        .tiptap hr {
          border: none;
          border-top: 1px solid #1c2a3d;
          margin: 20px 0;
        }
      `}</style>
    </div>
  )
})
