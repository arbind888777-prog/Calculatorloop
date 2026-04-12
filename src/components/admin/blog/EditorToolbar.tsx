"use client"

import type { Editor } from "@tiptap/react"
import { useState } from "react"

interface ToolbarProps {
  editor: Editor
  onOpenImageModal?: () => void
  onOpenVideoModal?: () => void
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 8px",
        background: active ? "rgba(59,130,246,0.15)" : "transparent",
        border: "none",
        borderRadius: "4px",
        color: active ? "#60a5fa" : "#7a8ba4",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        transition: "all 0.1s",
        minWidth: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "#1c2a3d",
        margin: "0 4px",
      }}
    />
  )
}

export function EditorToolbar({ editor, onOpenImageModal, onOpenVideoModal }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const handleAddLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setShowLinkInput(false)
    setLinkUrl("")
  }

  // Fallback: if no modal callback, use direct file picker (backwards compat)
  const handleImageUploadFallback = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/png,image/webp,image/gif"
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url }).run()
        }
      } catch {
        alert("Image upload failed")
      }
    }
    input.click()
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #1c2a3d",
        padding: "6px 10px",
        display: "flex",
        flexWrap: "wrap",
        gap: "2px",
        alignItems: "center",
        background: "#131d2e",
      }}
    >
      {/* Heading group */}
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="Paragraph"
      >
        ¶
      </ToolbarButton>

      <Divider />

      {/* Formatting group */}
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>

      <Divider />

      {/* Link */}
      <div style={{ position: "relative" }}>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Link"
        >
          🔗
        </ToolbarButton>
        {showLinkInput && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              background: "#131d2e",
              border: "1px solid #1c2a3d",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              autoFocus
              style={{
                width: "200px",
                padding: "6px 10px",
                background: "#0f1623",
                border: "1px solid #1c2a3d",
                borderRadius: "6px",
                color: "#e2e8f0",
                fontSize: "12px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleAddLink}
              style={{
                padding: "6px 12px",
                background: "#3b82f6",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        {"</>"}
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align Left"
      >
        ≡←
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align Center"
      >
        ≡↔
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align Right"
      >
        ≡→
      </ToolbarButton>

      <Divider />

      {/* Horizontal Rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        ―
      </ToolbarButton>

      <Divider />

      {/* Image — opens modal or falls back to file picker */}
      <ToolbarButton
        onClick={() => {
          if (onOpenImageModal) {
            onOpenImageModal()
          } else {
            handleImageUploadFallback()
          }
        }}
        title="Insert Image"
      >
        📷
      </ToolbarButton>

      {/* Video — opens modal */}
      <ToolbarButton
        onClick={() => {
          if (onOpenVideoModal) {
            onOpenVideoModal()
          }
        }}
        title="Insert Video"
      >
        🎬
      </ToolbarButton>

      <Divider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        ↪
      </ToolbarButton>
    </div>
  )
}
