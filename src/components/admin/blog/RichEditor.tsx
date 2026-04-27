"use client"

import { Mark, Node, mergeAttributes } from "@tiptap/core"
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react"
import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Youtube from "@tiptap/extension-youtube"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import CodeBlock from "@tiptap/extension-code-block"
import { useCallback, useEffect, useImperativeHandle, forwardRef, useRef } from "react"
import { EditorToolbar } from "./EditorToolbar"
import { InteractiveImageNodeView } from "./InteractiveImageNodeView"
import { FloatingTextBlockNodeView } from "./FloatingTextBlockNodeView"

const FONT_SIZE_STEPS = [12, 14, 16, 18, 22, 28, 36]
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
const IMAGE_SHAPES = ["standard", "rounded", "soft", "circle", "frame", "shadow"] as const

type ImageShape = (typeof IMAGE_SHAPES)[number]
type TextStyleAttributes = {
  color: string | null
  fontSize: string | null
  fontFamily: string | null
  backgroundColor: string | null
}

type TextSelectionRange = {
  from: number
  to: number
}

function normalizeTextStyleAttributes(attributes: Partial<TextStyleAttributes> = {}): TextStyleAttributes {
  return {
    color: attributes.color || null,
    fontSize: attributes.fontSize || null,
    fontFamily: attributes.fontFamily || null,
    backgroundColor: attributes.backgroundColor || null,
  }
}

function getImageAlignStyle(align: string | null | undefined) {
  if (align === "left") {
    return "display:block;margin-left:0;margin-right:auto;"
  }

  if (align === "right") {
    return "display:block;margin-left:auto;margin-right:0;"
  }

  return "display:block;margin-left:auto;margin-right:auto;"
}

function getImageShapeStyle(shape: ImageShape | string | null | undefined) {
  switch (shape) {
    case "rounded":
      return "border-radius:18px;"
    case "soft":
      return "border-radius:28px;"
    case "circle":
      return "border-radius:999px;aspect-ratio:1 / 1;object-fit:cover;"
    case "frame":
      return "border-radius:18px;padding:10px;background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.25);box-shadow:0 16px 40px rgba(15,23,42,0.18);"
    case "shadow":
      return "border-radius:16px;box-shadow:0 18px 45px rgba(15,23,42,0.28);"
    default:
      return "border-radius:8px;"
  }
}

function buildImageStyle(attributes: {
  width?: string | null
  dataAlign?: string | null
  shape?: ImageShape | string | null
  offsetX?: number | null
  offsetY?: number | null
  style?: string | null
}) {
  return [
    attributes.width ? `width:${attributes.width};` : "",
    getImageAlignStyle(attributes.dataAlign),
    getImageShapeStyle(attributes.shape),
    Number(attributes.offsetX || 0) || Number(attributes.offsetY || 0)
      ? `transform:translate(${Number(attributes.offsetX || 0)}px, ${Number(attributes.offsetY || 0)}px);`
      : "",
    attributes.style || "",
  ]
    .filter(Boolean)
    .join("")
}

function getImageWidthNumber(width: string | null | undefined) {
  const parsed = Number.parseInt(width || "100", 10)
  if (Number.isNaN(parsed)) return 100
  return Math.min(100, Math.max(20, parsed))
}

function getNextFontSize(currentFontSize: string | null | undefined, direction: "smaller" | "larger") {
  const current = Number.parseInt(currentFontSize || "16", 10)
  const index = FONT_SIZE_STEPS.findIndex((step) => step >= current)
  const currentIndex = index === -1 ? FONT_SIZE_STEPS.length - 1 : index

  if (direction === "smaller") {
    return `${FONT_SIZE_STEPS[Math.max(0, currentIndex - 1)]}px`
  }

  return `${FONT_SIZE_STEPS[Math.min(FONT_SIZE_STEPS.length - 1, currentIndex + 1)]}px`
}

function hasTextSelection(editor: Editor) {
  if (editor.isActive("image") || editor.state.selection.empty) {
    return false
  }

  return editor.state.doc
    .textBetween(editor.state.selection.from, editor.state.selection.to, " ")
    .trim().length > 0
}

function getTextSelectionRange(editor: Editor): TextSelectionRange | null {
  if (!hasTextSelection(editor)) {
    return null
  }

  return {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  }
}

const TextStyle = Mark.create({
  name: "textStyle",
  priority: 1000,

  parseHTML() {
    return [{ tag: "span" }]
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || element.getAttribute("data-color"),
        renderHTML: () => ({}),
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || element.getAttribute("data-font-size"),
        renderHTML: () => ({}),
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || element.getAttribute("data-font-family"),
        renderHTML: () => ({}),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) =>
          element.style.backgroundColor || element.getAttribute("data-background-color"),
        renderHTML: () => ({}),
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const textStyleAttributes = normalizeTextStyleAttributes({
      color: HTMLAttributes.color,
      fontSize: HTMLAttributes.fontSize,
      fontFamily: HTMLAttributes.fontFamily,
      backgroundColor: HTMLAttributes.backgroundColor,
    })

    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.color
    delete renderedAttributes.fontSize
    delete renderedAttributes.fontFamily
    delete renderedAttributes.backgroundColor

    const style = [
      textStyleAttributes.color ? `color:${textStyleAttributes.color};` : "",
      textStyleAttributes.fontSize ? `font-size:${textStyleAttributes.fontSize};` : "",
      textStyleAttributes.fontFamily ? `font-family:${textStyleAttributes.fontFamily};` : "",
      textStyleAttributes.backgroundColor
        ? `background-color:${textStyleAttributes.backgroundColor};padding:0 2px;border-radius:4px;`
        : "",
      renderedAttributes.style || "",
    ]
      .filter(Boolean)
      .join("")

    return [
      "span",
      mergeAttributes(renderedAttributes, {
        ...(textStyleAttributes.color ? { "data-color": textStyleAttributes.color } : {}),
        ...(textStyleAttributes.fontSize ? { "data-font-size": textStyleAttributes.fontSize } : {}),
        ...(textStyleAttributes.fontFamily ? { "data-font-family": textStyleAttributes.fontFamily } : {}),
        ...(textStyleAttributes.backgroundColor
          ? { "data-background-color": textStyleAttributes.backgroundColor }
          : {}),
        ...(style ? { style } : {}),
      }),
      0,
    ]
  },
})

const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.style.width || element.getAttribute("data-width"),
        renderHTML: (attributes) => attributes.width ? { "data-width": attributes.width } : {},
      },
      dataAlign: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.dataAlign || "center" }),
      },
      shape: {
        default: "rounded",
        parseHTML: (element) => element.getAttribute("data-shape") || "rounded",
        renderHTML: (attributes) => ({ "data-shape": attributes.shape || "rounded" }),
      },
      offsetX: {
        default: 0,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-offset-x") || "0", 10) || 0,
        renderHTML: (attributes) => ({ "data-offset-x": attributes.offsetX || 0 }),
      },
      offsetY: {
        default: 0,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-offset-y") || "0", 10) || 0,
        renderHTML: (attributes) => ({ "data-offset-y": attributes.offsetY || 0 }),
      },
    }
  },
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(InteractiveImageNodeView)
  },
  renderHTML({ HTMLAttributes }) {
    const renderedAttributes = { ...HTMLAttributes }
    const width = renderedAttributes.width || renderedAttributes["data-width"]
    const align = renderedAttributes.dataAlign || renderedAttributes["data-align"] || "center"
    const shape = renderedAttributes.shape || renderedAttributes["data-shape"] || "rounded"
    const offsetX = Number(renderedAttributes.offsetX || renderedAttributes["data-offset-x"] || 0)
    const offsetY = Number(renderedAttributes.offsetY || renderedAttributes["data-offset-y"] || 0)
    const existingClass = typeof renderedAttributes.class === "string" ? renderedAttributes.class : ""
    const style = buildImageStyle({
      width,
      dataAlign: align,
      shape,
      offsetX,
      offsetY,
      style: typeof renderedAttributes.style === "string" ? renderedAttributes.style : "",
    })

    delete renderedAttributes.width
    delete renderedAttributes.dataAlign
    delete renderedAttributes.shape
    delete renderedAttributes.offsetX
    delete renderedAttributes.offsetY

    return [
      "img",
      {
        ...renderedAttributes,
        class: `${existingClass} blog-image`.trim(),
        "data-align": align,
        "data-width": width || undefined,
        "data-shape": shape,
        "data-offset-x": offsetX,
        "data-offset-y": offsetY,
        style,
      },
    ]
  },
})

const FloatingTextBlock = Node.create({
  name: "floatingTextBlock",
  group: "block",
  content: "block+",
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      x: {
        default: 0,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-x") || "0", 10) || 0,
        renderHTML: (attributes) => ({ "data-x": attributes.x || 0 }),
      },
      y: {
        default: 0,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-y") || "0", 10) || 0,
        renderHTML: (attributes) => ({ "data-y": attributes.y || 0 }),
      },
      width: {
        default: 320,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-width") || "320", 10) || 320,
        renderHTML: (attributes) => ({ "data-width": attributes.width || 320 }),
      },
      minHeight: {
        default: 120,
        parseHTML: (element) => Number.parseInt(element.getAttribute("data-min-height") || "120", 10) || 120,
        renderHTML: (attributes) => ({ "data-min-height": attributes.minHeight || 120 }),
      },
      backgroundColor: {
        default: "rgba(30,41,59,0.92)",
        parseHTML: (element) =>
          element.getAttribute("data-background-color") || "rgba(30,41,59,0.92)",
        renderHTML: (attributes) => ({
          "data-background-color": attributes.backgroundColor || "rgba(30,41,59,0.92)",
        }),
      },
      textColor: {
        default: "#e2e8f0",
        parseHTML: (element) => element.getAttribute("data-text-color") || "#e2e8f0",
        renderHTML: (attributes) => ({ "data-text-color": attributes.textColor || "#e2e8f0" }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-floating-text-block]" }]
  },

  renderHTML({ HTMLAttributes }) {
    const width = Number(HTMLAttributes.width || HTMLAttributes["data-width"] || 320)
    const minHeight = Number(HTMLAttributes.minHeight || HTMLAttributes["data-min-height"] || 120)
    const x = Number(HTMLAttributes.x || HTMLAttributes["data-x"] || 0)
    const y = Number(HTMLAttributes.y || HTMLAttributes["data-y"] || 0)
    const backgroundColor =
      HTMLAttributes.backgroundColor ||
      HTMLAttributes["data-background-color"] ||
      "rgba(30,41,59,0.92)"
    const textColor = HTMLAttributes.textColor || HTMLAttributes["data-text-color"] || "#e2e8f0"

    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.width
    delete renderedAttributes.minHeight
    delete renderedAttributes.x
    delete renderedAttributes.y
    delete renderedAttributes.backgroundColor
    delete renderedAttributes.textColor

    return [
      "div",
      mergeAttributes(renderedAttributes, {
        "data-floating-text-block": "true",
        "data-width": width,
        "data-min-height": minHeight,
        "data-x": x,
        "data-y": y,
        "data-background-color": backgroundColor,
        "data-text-color": textColor,
        class: "floating-text-block",
        style: [
          "position:relative;",
          "display:block;",
          `width:${width}px;`,
          "max-width:100%;",
          `min-height:${minHeight}px;`,
          "margin:18px 0;",
          `transform:translate(${x}px, ${y}px);`,
          `background:${backgroundColor};`,
          `color:${textColor};`,
          "border-radius:18px;",
          "border:1px solid rgba(148,163,184,0.22);",
          "box-shadow:0 20px 50px rgba(2,6,23,0.22);",
        ].join(""),
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingTextBlockNodeView)
  },
})

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
      TextStyle,
      FloatingTextBlock,
      BlogImage.configure({
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
            const dropPosition = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })
            uploadAndInsertImage(file, view, dropPosition?.pos)
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

  const lastTextSelectionRef = useRef<TextSelectionRange | null>(null)

  const runOnSelectedText = useCallback(
    (callback: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
      if (!editor) return

      const range = getTextSelectionRange(editor) || lastTextSelectionRef.current
      if (!range) return

      callback(editor.chain().focus().setTextSelection(range)).run()
    },
    [editor]
  )

  useEffect(() => {
    if (!editor) return

    const rememberSelection = () => {
      const range = getTextSelectionRange(editor)
      if (range) {
        lastTextSelectionRef.current = range
      }
    }

    rememberSelection()
    editor.on("selectionUpdate", rememberSelection)

    return () => {
      editor.off("selectionUpdate", rememberSelection)
    }
  }, [editor])

  const applyTextStyle = useCallback((editorInstance: Editor, patch: Partial<TextStyleAttributes>) => {
    const nextAttributes = {
      ...normalizeTextStyleAttributes(editorInstance.getAttributes("textStyle")),
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
  }, [runOnSelectedText])

  // Sync content when language changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const uploadAndInsertImage = useCallback(
    async (file: File, view: any, insertAt?: number) => {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          const { state } = view
          const pos = typeof insertAt === "number" ? insertAt : state.selection.from
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

  const currentImageAttributes = editor.getAttributes("image") as {
    width?: string | null
    dataAlign?: string | null
    shape?: ImageShape | null
    offsetX?: number | null
    offsetY?: number | null
  }
  const currentTextStyle = normalizeTextStyleAttributes(editor.getAttributes("textStyle"))

  const setImageWidthPercent = (width: number) => {
    editor.chain().focus().updateAttributes("image", { width: `${Math.round(width)}%` }).run()
  }

  const adjustSelectedTextSize = (direction: "smaller" | "larger") => {
    applyTextStyle(editor, { fontSize: getNextFontSize(currentTextStyle.fontSize, direction) })
  }

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
      <BubbleMenu
        editor={editor}
        shouldShow={({ state, editor: currentEditor }: any) =>
          !state.selection.empty && !currentEditor.isActive("image")
        }
        options={{ placement: "top", offset: 8 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px",
          borderRadius: "10px",
          background: "rgba(8,13,26,0.96)",
          border: "1px solid #1c2a3d",
          boxShadow: "0 16px 45px rgba(2,6,23,0.45)",
        }}
      >
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runOnSelectedText((chain) => chain.toggleBold())}
          style={{
            minWidth: "30px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: editor.isActive("bold") ? "rgba(59,130,246,0.18)" : "transparent",
            color: editor.isActive("bold") ? "#93c5fd" : "#cbd5e1",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runOnSelectedText((chain) => chain.toggleItalic())}
          style={{
            minWidth: "30px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: editor.isActive("italic") ? "rgba(59,130,246,0.18)" : "transparent",
            color: editor.isActive("italic") ? "#93c5fd" : "#cbd5e1",
            cursor: "pointer",
            fontStyle: "italic",
            fontWeight: 700,
          }}
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runOnSelectedText((chain) => chain.toggleUnderline())}
          style={{
            minWidth: "30px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: editor.isActive("underline") ? "rgba(59,130,246,0.18)" : "transparent",
            color: editor.isActive("underline") ? "#93c5fd" : "#cbd5e1",
            cursor: "pointer",
            textDecoration: "underline",
            fontWeight: 700,
          }}
        >
          U
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => adjustSelectedTextSize("smaller")}
          style={{
            minWidth: "34px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: "rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          A-
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => adjustSelectedTextSize("larger")}
          style={{
            minWidth: "34px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: "rgba(148,163,184,0.12)",
            color: "#cbd5e1",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          A+
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "2px" }}>
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTextStyle(editor, { color })}
              title={color}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                border: currentTextStyle.color === color ? "2px solid #e2e8f0" : "1px solid rgba(255,255,255,0.2)",
                background: color,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {HIGHLIGHT_OPTIONS.map((backgroundColor) => (
            <button
              key={backgroundColor}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTextStyle(editor, { backgroundColor })}
              title={`Highlight ${backgroundColor}`}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                border:
                  currentTextStyle.backgroundColor === backgroundColor
                    ? "2px solid #e2e8f0"
                    : "1px solid rgba(255,255,255,0.2)",
                background: backgroundColor,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            applyTextStyle(editor, {
              color: null,
              fontSize: null,
              fontFamily: null,
              backgroundColor: null,
            })
          }
          style={{
            minWidth: "52px",
            height: "30px",
            border: "none",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.12)",
            color: "#fecaca",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          Reset
        </button>
      </BubbleMenu>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: currentEditor }: any) => currentEditor.isActive("image")}
        options={{ placement: "top", offset: 10 }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "280px",
          padding: "10px",
          borderRadius: "12px",
          background: "rgba(8,13,26,0.97)",
          border: "1px solid #1c2a3d",
          boxShadow: "0 18px 50px rgba(2,6,23,0.45)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#93c5fd", fontWeight: 700, letterSpacing: "0.02em" }}>
            Image width {getImageWidthNumber(currentImageAttributes.width)}%
          </span>
          <span style={{ fontSize: "11px", color: "#7c93b3" }}>
            Click image then resize
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={100}
          step={5}
          value={getImageWidthNumber(currentImageAttributes.width)}
          onMouseDown={(event) => event.preventDefault()}
          onChange={(event) => setImageWidthPercent(Number(event.target.value))}
          style={{ width: "100%", accentColor: "#60a5fa" }}
        />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[35, 50, 70, 100].map((width) => (
            <button
              key={width}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setImageWidthPercent(width)}
              style={{
                flex: "1 1 56px",
                minHeight: "30px",
                borderRadius: "8px",
                border: "1px solid #1e293b",
                background:
                  getImageWidthNumber(currentImageAttributes.width) === width
                    ? "rgba(59,130,246,0.18)"
                    : "rgba(148,163,184,0.1)",
                color:
                  getImageWidthNumber(currentImageAttributes.width) === width ? "#93c5fd" : "#cbd5e1",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {width}%
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().updateAttributes("image", { dataAlign: align }).run()}
              style={{
                flex: 1,
                minHeight: "30px",
                borderRadius: "8px",
                border: "1px solid #1e293b",
                background:
                  (currentImageAttributes.dataAlign || "center") === align
                    ? "rgba(59,130,246,0.18)"
                    : "rgba(148,163,184,0.1)",
                color:
                  (currentImageAttributes.dataAlign || "center") === align ? "#93c5fd" : "#cbd5e1",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {align}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "6px" }}>
          {IMAGE_SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().updateAttributes("image", { shape }).run()}
              style={{
                minHeight: "32px",
                borderRadius: "8px",
                border: "1px solid #1e293b",
                background:
                  (currentImageAttributes.shape || "rounded") === shape
                    ? "rgba(59,130,246,0.18)"
                    : "rgba(148,163,184,0.1)",
                color:
                  (currentImageAttributes.shape || "rounded") === shape ? "#93c5fd" : "#cbd5e1",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {shape}
            </button>
          ))}
        </div>
      </BubbleMenu>
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
        Paste formatted content, drop screenshots into the editor, select text to style it, or click an image to resize it and change its shape.
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
          margin: 12px 0;
          transition: width 0.15s ease, border-radius 0.15s ease, box-shadow 0.15s ease;
        }
        .tiptap img.ProseMirror-selectednode {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
        }
        .tiptap .blog-callout,
        .tiptap .blog-faq,
        .tiptap .blog-toc {
          border: 1px solid #1c2a3d;
          border-radius: 10px;
          margin: 14px 0;
          padding: 14px 16px;
          background: rgba(59,130,246,0.08);
        }
        .tiptap .blog-faq {
          background: rgba(34,197,94,0.07);
        }
        .tiptap .blog-toc {
          background: rgba(168,85,247,0.07);
        }
        .tiptap table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          overflow: hidden;
          border-radius: 8px;
        }
        .tiptap th,
        .tiptap td {
          border: 1px solid #1c2a3d;
          padding: 10px 12px;
          vertical-align: top;
        }
        .tiptap th {
          background: rgba(59,130,246,0.12);
          color: #e2e8f0;
          font-weight: 700;
        }
        .tiptap .blog-video {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap .floating-text-block p:first-child {
          margin-top: 0;
        }
        .tiptap .floating-text-block p:last-child {
          margin-bottom: 0;
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
