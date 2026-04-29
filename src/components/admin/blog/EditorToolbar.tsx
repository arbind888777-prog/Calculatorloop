"use client"

import type { Editor } from "@tiptap/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Code2,
  ImageIcon,
  Info,
  LinkIcon,
  List,
  ListOrdered,
  ListTree,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Table2,
  Type,
  Undo2,
  Video,
} from "lucide-react"

const FONT_FAMILY_OPTIONS = [
  { value: "", label: "Font" },
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times" },
  { value: "'Courier New', monospace", label: "Courier" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
]

const FONT_SIZE_OPTIONS = [
  { value: "", label: "Size" },
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "22px", label: "22" },
  { value: "28px", label: "28" },
  { value: "36px", label: "36" },
]

const COLOR_OPTIONS = [
  "#e2e8f0",
  "#f87171",
  "#f59e0b",
  "#22c55e",
  "#38bdf8",
  "#818cf8",
  "#f472b6",
]

const HIGHLIGHT_OPTIONS = ["#fef08a", "#bfdbfe", "#bbf7d0", "#fecdd3", "#e9d5ff"]

const IMAGE_WIDTH_OPTIONS = ["35%", "50%", "70%", "100%"] as const
const IMAGE_SHAPE_OPTIONS = ["standard", "rounded", "soft", "circle", "frame", "shadow"] as const

interface ToolbarProps {
  editor: Editor
  onOpenImageModal?: () => void
  onOpenVideoModal?: () => void
}

type TextSelectionRange = {
  from: number
  to: number
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
  disabled,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
  title: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-label={title}
      style={{
        width: "32px",
        height: "32px",
        padding: 0,
        background: active ? "rgba(59,130,246,0.15)" : "transparent",
        border: "none",
        borderRadius: "6px",
        color: disabled ? "#334155" : active ? "#60a5fa" : "#7a8ba4",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "11px",
        fontWeight: active ? 700 : 600,
        transition: "all 0.1s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        opacity: disabled ? 0.55 : 1,
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
        height: "22px",
        background: "#1c2a3d",
        margin: "0 4px",
      }}
    />
  )
}

function ToolbarSelect({
  value,
  onChange,
  options,
  title,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  title: string
  disabled?: boolean
}) {
  return (
    <select
      aria-label={title}
      title={title}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      style={{
        height: "32px",
        minWidth: "72px",
        padding: "0 10px",
        borderRadius: "6px",
        border: "1px solid #1c2a3d",
        background: "#0f1623",
        color: disabled ? "#64748b" : "#cbd5e1",
        fontSize: "11px",
        fontWeight: 600,
        outline: "none",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {options.map((option) => (
        <option key={`${title}-${option.value || "default"}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function EditorToolbar({ editor, onOpenImageModal, onOpenVideoModal }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [hasRememberedTextSelection, setHasRememberedTextSelection] = useState(false)
  const imageSelected = editor.isActive("image")
  const lastTextSelectionRef = useRef<TextSelectionRange | null>(null)
  const getCurrentTextSelection = () => {
    if (editor.isActive("image") || editor.state.selection.empty) {
      return null
    }

    const selectedText = editor.state.doc
      .textBetween(editor.state.selection.from, editor.state.selection.to, " ")
      .trim()

    if (!selectedText) {
      return null
    }

    return {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    }
  }

  const activeTextSelection = getCurrentTextSelection()
  const canEditText = Boolean(activeTextSelection || hasRememberedTextSelection)
  const currentTextStyle = editor.getAttributes("textStyle") as {
    color?: string | null
    fontSize?: string | null
    fontFamily?: string | null
    backgroundColor?: string | null
  }
  const currentImageAttributes = editor.getAttributes("image") as {
    dataAlign?: "left" | "center" | "right"
    shape?: string
    width?: string
  }

  useEffect(() => {
    const rememberSelection = () => {
      const range = getCurrentTextSelection()
      if (range) {
        lastTextSelectionRef.current = range
        setHasRememberedTextSelection(true)
      }
    }

    rememberSelection()
    editor.on("selectionUpdate", rememberSelection)

    return () => {
      editor.off("selectionUpdate", rememberSelection)
    }
  }, [editor])

  const runOnSelectedText = (callback: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    const range = getCurrentTextSelection() || lastTextSelectionRef.current
    if (!range) return

    callback(editor.chain().focus().setTextSelection(range)).run()
  }

  const applyTextStyle = (
    patch: Partial<{
      color: string | null
      fontSize: string | null
      fontFamily: string | null
      backgroundColor: string | null
    }>
  ) => {
    const nextAttributes = {
      color: currentTextStyle.color || null,
      fontSize: currentTextStyle.fontSize || null,
      fontFamily: currentTextStyle.fontFamily || null,
      backgroundColor: currentTextStyle.backgroundColor || null,
      ...patch,
    }

    if (
      !nextAttributes.color &&
      !nextAttributes.fontSize &&
      !nextAttributes.fontFamily &&
      !nextAttributes.backgroundColor
    ) {
      runOnSelectedText((chain) => chain.unsetMark("textStyle"))
      return
    }

    runOnSelectedText((chain) => chain.setMark("textStyle", nextAttributes))
  }

  const handleAddLink = () => {
    runOnSelectedText((chain) =>
      linkUrl
        ? chain.extendMarkRange("link").setLink({ href: linkUrl })
        : chain.unsetLink()
    )
    setShowLinkInput(false)
    setLinkUrl("")
  }

  const toggleTextMark = (
    callback: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>
  ) => {
    runOnSelectedText(callback)
  }

  const handleImageUploadFallback = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/png,image/webp,image/gif"
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        }
      } catch {
        alert("Image upload failed")
      }
    }
    input.click()
  }

  const setImageWidth = (width: string) => {
    editor.chain().focus().updateAttributes("image", { width }).run()
  }

  const setImageAlign = (dataAlign: "left" | "center" | "right") => {
    editor.chain().focus().updateAttributes("image", { dataAlign }).run()
  }

  const setImageShape = (shape: (typeof IMAGE_SHAPE_OPTIONS)[number]) => {
    editor.chain().focus().updateAttributes("image", { shape }).run()
  }

  const insertCallout = () => {
    editor.chain().focus().insertContent(`
      <div class="blog-callout">
        <p><strong>Helpful note:</strong> Add an important tip, warning, or shortcut here.</p>
      </div>
    `).run()
  }

  const insertFaq = () => {
    editor.chain().focus().insertContent(`
      <section class="blog-faq">
        <h2>Frequently Asked Questions</h2>
        <h3>Question goes here?</h3>
        <p>Write a clear, short answer here.</p>
        <h3>Another question?</h3>
        <p>Add another useful answer here.</p>
      </section>
    `).run()
  }

  const insertToc = () => {
    editor.chain().focus().insertContent(`
      <nav class="blog-toc">
        <p><strong>In this guide</strong></p>
        <ul>
          <li><a href="#section-one">Section one</a></li>
          <li><a href="#section-two">Section two</a></li>
          <li><a href="#faq">FAQs</a></li>
        </ul>
      </nav>
    `).run()
  }

  const insertTable = () => {
    editor.chain().focus().insertContent(`
      <table>
        <thead>
          <tr><th>Item</th><th>Details</th><th>Tip</th></tr>
        </thead>
        <tbody>
          <tr><td>Example</td><td>Add useful information</td><td>Keep it short</td></tr>
          <tr><td>Example</td><td>Add useful information</td><td>Keep it short</td></tr>
        </tbody>
      </table>
    `).run()
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #1c2a3d",
        padding: "7px 10px",
        display: "flex",
        flexWrap: "wrap",
        gap: "3px",
        alignItems: "center",
        background: "#131d2e",
        position: "sticky",
        top: 0,
        zIndex: 5,
        overflowX: "auto",
      }}
    >
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
        <Pilcrow size={15} />
      </ToolbarButton>

      <Divider />

      <ToolbarSelect
        value={currentTextStyle.fontFamily || ""}
        onChange={(value) => applyTextStyle({ fontFamily: value || null })}
        options={FONT_FAMILY_OPTIONS}
        title="Font Family"
        disabled={!canEditText}
      />
      <ToolbarSelect
        value={currentTextStyle.fontSize || ""}
        onChange={(value) => applyTextStyle({ fontSize: value || null })}
        options={FONT_SIZE_OPTIONS}
        title="Font Size"
        disabled={!canEditText}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 2px" }}>
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color}
            type="button"
            disabled={!canEditText}
            title={`Text color ${color}`}
            aria-label={`Text color ${color}`}
            onClick={() => applyTextStyle({ color })}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "999px",
              border:
                currentTextStyle.color === color
                  ? "2px solid #e2e8f0"
                  : "1px solid rgba(255,255,255,0.18)",
              background: color,
              cursor: !canEditText ? "not-allowed" : "pointer",
              opacity: !canEditText ? 0.45 : 1,
            }}
          />
        ))}
        {HIGHLIGHT_OPTIONS.map((backgroundColor) => (
          <button
            key={backgroundColor}
            type="button"
            disabled={!canEditText}
            title={`Highlight ${backgroundColor}`}
            aria-label={`Highlight ${backgroundColor}`}
            onClick={() => applyTextStyle({ backgroundColor })}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "4px",
              border:
                currentTextStyle.backgroundColor === backgroundColor
                  ? "2px solid #e2e8f0"
                  : "1px solid rgba(255,255,255,0.18)",
              background: backgroundColor,
              cursor: !canEditText ? "not-allowed" : "pointer",
              opacity: !canEditText ? 0.45 : 1,
            }}
          />
        ))}
        <button
          type="button"
          disabled={!canEditText}
          onClick={() =>
            applyTextStyle({ color: null, fontSize: null, fontFamily: null, backgroundColor: null })
          }
          title="Reset Text Style"
          aria-label="Reset Text Style"
          style={{
            height: "24px",
            padding: "0 8px",
            border: "1px solid #1c2a3d",
            borderRadius: "999px",
            background: "rgba(239,68,68,0.1)",
            color: "#fecaca",
            cursor: !canEditText ? "not-allowed" : "pointer",
            fontSize: "10px",
            fontWeight: 700,
            opacity: !canEditText ? 0.6 : 1,
          }}
        >
          Reset
        </button>
      </div>

      <Divider />

      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => toggleTextMark((chain) => chain.toggleBold())}
        title="Bold"
        disabled={!canEditText}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => toggleTextMark((chain) => chain.toggleItalic())}
        title="Italic"
        disabled={!canEditText}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => toggleTextMark((chain) => chain.toggleUnderline())}
        title="Underline"
        disabled={!canEditText}
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => toggleTextMark((chain) => chain.toggleStrike())}
        title="Strikethrough"
        disabled={!canEditText}
      >
        <s>S</s>
      </ToolbarButton>

      <Divider />

      <div style={{ position: "relative" }}>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Link"
        >
          <LinkIcon size={15} />
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
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAddLink()}
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
              type="button"
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

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        <Code2 size={15} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align Text Left"
      >
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align Text Center"
      >
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align Text Right"
      >
        <AlignRight size={15} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          if (onOpenImageModal) onOpenImageModal()
          else handleImageUploadFallback()
        }}
        title="Insert Image"
      >
        <ImageIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onOpenVideoModal?.()}
        title="Insert Video"
      >
        <Video size={15} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={insertCallout} title="Insert Callout">
        <Info size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={insertFaq} title="Insert FAQ Block">
        FAQ
      </ToolbarButton>
      <ToolbarButton onClick={insertToc} title="Insert Table of Contents">
        <ListTree size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={insertTable} title="Insert Table">
        <Table2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: "floatingTextBlock",
              attrs: {
                x: 0,
                y: 0,
                width: 320,
                minHeight: 120,
                backgroundColor: "rgba(30,41,59,0.92)",
                textColor: "#e2e8f0",
              },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Write here..." }],
                },
              ],
            })
            .run()
        }
        title="Insert Free Text Block"
      >
        <Type size={15} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={currentImageAttributes.dataAlign === "left"}
        onClick={() => setImageAlign("left")}
        title="Image Left"
        disabled={!imageSelected}
      >
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={(currentImageAttributes.dataAlign || "center") === "center"}
        onClick={() => setImageAlign("center")}
        title="Image Center"
        disabled={!imageSelected}
      >
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton
        active={currentImageAttributes.dataAlign === "right"}
        onClick={() => setImageAlign("right")}
        title="Image Right"
        disabled={!imageSelected}
      >
        <AlignRight size={15} />
      </ToolbarButton>
      {IMAGE_WIDTH_OPTIONS.map((width) => (
        <ToolbarButton
          key={width}
          active={currentImageAttributes.width === width}
          onClick={() => setImageWidth(width)}
          title={`Image Width ${width}`}
          disabled={!imageSelected}
        >
          {width.replace("%", "")}
        </ToolbarButton>
      ))}
      {IMAGE_SHAPE_OPTIONS.map((shape) => (
        <ToolbarButton
          key={shape}
          active={(currentImageAttributes.shape || "rounded") === shape}
          onClick={() => setImageShape(shape)}
          title={`Image Shape ${shape}`}
          disabled={!imageSelected}
        >
          {shape.slice(0, 2).toUpperCase()}
        </ToolbarButton>
      ))}

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  )
}
