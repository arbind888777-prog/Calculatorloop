import React from "react"

type BadgeColor = "blue" | "green" | "red" | "yellow" | "purple" | "gray"

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  dot?: boolean
  style?: React.CSSProperties
}

const colorMap: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", dot: "#3b82f6" },
  green: { bg: "rgba(34,197,94,0.15)", text: "#4ade80", dot: "#22c55e" },
  red: { bg: "rgba(239,68,68,0.15)", text: "#f87171", dot: "#ef4444" },
  yellow: { bg: "rgba(234,179,8,0.15)", text: "#facc15", dot: "#eab308" },
  purple: { bg: "rgba(168,85,247,0.15)", text: "#c084fc", dot: "#a855f7" },
  gray: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", dot: "#64748b" },
}

export function Badge({ children, color = "blue", dot = false, style }: BadgeProps) {
  const colors = colorMap[color]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        letterSpacing: "0.3px",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: colors.dot,
          }}
        />
      )}
      {children}
    </span>
  )
}
