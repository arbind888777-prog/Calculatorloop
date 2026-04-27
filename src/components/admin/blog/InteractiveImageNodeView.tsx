"use client"

import { useRef, type MouseEvent as ReactMouseEvent } from "react"
import { Maximize2, Move } from "lucide-react"
import { NodeViewWrapper } from "@tiptap/react"

interface InteractiveImageNodeViewProps {
  node: any
  selected: boolean
  updateAttributes: (attributes: Record<string, unknown>) => void
}

function getImageShapeStyle(shape: string | null | undefined) {
  switch (shape) {
    case "rounded":
      return { borderRadius: "18px" }
    case "soft":
      return { borderRadius: "28px" }
    case "circle":
      return { borderRadius: "999px", aspectRatio: "1 / 1", objectFit: "cover" as const }
    case "frame":
      return {
        borderRadius: "18px",
        padding: "10px",
        background: "rgba(148,163,184,0.12)",
        border: "1px solid rgba(148,163,184,0.25)",
        boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
      }
    case "shadow":
      return {
        borderRadius: "16px",
        boxShadow: "0 18px 45px rgba(15,23,42,0.28)",
      }
    default:
      return { borderRadius: "8px" }
  }
}

export function InteractiveImageNodeView({
  node,
  selected,
  updateAttributes,
}: InteractiveImageNodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const startDragging = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const initialX = Number(node.attrs.offsetX || 0)
    const initialY = Number(node.attrs.offsetY || 0)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateAttributes({
        offsetX: Math.round(initialX + (moveEvent.clientX - startX)),
        offsetY: Math.round(initialY + (moveEvent.clientY - startY)),
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

    const parentWidth = wrapperRef.current?.parentElement?.clientWidth || 900
    const startX = event.clientX
    const initialWidth = Number.parseInt(node.attrs.width || "100", 10)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(
        100,
        Math.max(20, Math.round(initialWidth + ((moveEvent.clientX - startX) / parentWidth) * 100))
      )

      updateAttributes({ width: `${nextWidth}%` })
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
        width: node.attrs.width || "100%",
        maxWidth: "100%",
        margin:
          node.attrs.dataAlign === "left"
            ? "12px auto 12px 0"
            : node.attrs.dataAlign === "right"
              ? "12px 0 12px auto"
              : "12px auto",
        transform: `translate(${Number(node.attrs.offsetX || 0)}px, ${Number(node.attrs.offsetY || 0)}px)`,
        transition: "box-shadow 0.15s ease",
        boxShadow: selected ? "0 0 0 2px rgba(96,165,250,0.9)" : "none",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          draggable={false}
          style={{
            width: "100%",
            display: "block",
            maxWidth: "100%",
            ...getImageShapeStyle(node.attrs.shape),
          }}
        />
        <button
          type="button"
          onMouseDown={startDragging}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            width: "32px",
            height: "32px",
            border: "none",
            borderRadius: "999px",
            background: "rgba(15,23,42,0.78)",
            color: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
          }}
          title="Drag image"
          aria-label="Drag image"
        >
          <Move size={16} />
        </button>
        <button
          type="button"
          onMouseDown={startResizing}
          style={{
            position: "absolute",
            right: "10px",
            bottom: "10px",
            width: "32px",
            height: "32px",
            border: "none",
            borderRadius: "999px",
            background: "rgba(15,23,42,0.78)",
            color: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "nwse-resize",
          }}
          title="Resize image"
          aria-label="Resize image"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  )
}
