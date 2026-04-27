"use client"

import { useRef, type MouseEvent as ReactMouseEvent } from "react"
import { Maximize2, Move, Type } from "lucide-react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"

interface FloatingTextBlockNodeViewProps {
  node: any
  selected: boolean
  updateAttributes: (attributes: Record<string, unknown>) => void
}

export function FloatingTextBlockNodeView({
  node,
  selected,
  updateAttributes,
}: FloatingTextBlockNodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const startDragging = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const initialX = Number(node.attrs.x || 0)
    const initialY = Number(node.attrs.y || 0)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateAttributes({
        x: Math.round(initialX + (moveEvent.clientX - startX)),
        y: Math.round(initialY + (moveEvent.clientY - startY)),
      })
    }

    const stopDragging = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", stopDragging)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", stopDragging)
  }

  const startResizing = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const initialWidth = Number(node.attrs.width || 320)
    const initialHeight = Number(node.attrs.minHeight || 120)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateAttributes({
        width: Math.max(220, Math.round(initialWidth + (moveEvent.clientX - startX))),
        minHeight: Math.max(100, Math.round(initialHeight + (moveEvent.clientY - startY))),
      })
    }

    const stopResizing = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", stopResizing)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", stopResizing)
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "block",
        width: `${Number(node.attrs.width || 320)}px`,
        maxWidth: "100%",
        minHeight: `${Number(node.attrs.minHeight || 120)}px`,
        margin: "18px 0",
        transform: `translate(${Number(node.attrs.x || 0)}px, ${Number(node.attrs.y || 0)}px)`,
        background: node.attrs.backgroundColor || "rgba(30,41,59,0.92)",
        color: node.attrs.textColor || "#e2e8f0",
        borderRadius: "18px",
        border: selected ? "2px solid rgba(96,165,250,0.9)" : "1px solid rgba(148,163,184,0.22)",
        boxShadow: "0 20px 50px rgba(2,6,23,0.22)",
      }}
    >
      <div
        contentEditable={false}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "10px 12px",
          borderBottom: "1px solid rgba(148,163,184,0.18)",
          color: "#cbd5e1",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Type size={14} />
          Free Text Block
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onMouseDown={startDragging}
            style={{
              width: "30px",
              height: "30px",
              border: "none",
              borderRadius: "999px",
              background: "rgba(15,23,42,0.68)",
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
            }}
            title="Move text block"
            aria-label="Move text block"
          >
            <Move size={15} />
          </button>
          <button
            type="button"
            onMouseDown={startResizing}
            style={{
              width: "30px",
              height: "30px",
              border: "none",
              borderRadius: "999px",
              background: "rgba(15,23,42,0.68)",
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "nwse-resize",
            }}
            title="Resize text block"
            aria-label="Resize text block"
          >
            <Maximize2 size={15} />
          </button>
        </span>
      </div>
      <NodeViewContent
        style={{
          padding: "14px 16px 18px",
          minHeight: `${Math.max(80, Number(node.attrs.minHeight || 120) - 52)}px`,
          outline: "none",
          cursor: "text",
          whiteSpace: "pre-wrap",
        }}
      />
    </NodeViewWrapper>
  )
}
