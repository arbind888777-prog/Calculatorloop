import React from "react"

type ButtonVariant = "primary" | "outline" | "danger" | "ghost" | "success"
type ButtonSize = "sm" | "md" | "lg"

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
  },
  outline: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #1c2a3d",
  },
  danger: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 8px rgba(239,68,68,0.25)",
  },
  ghost: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
  },
  success: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 8px rgba(34,197,94,0.25)",
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: "12px", borderRadius: "6px" },
  md: { padding: "10px 18px", fontSize: "13px", borderRadius: "8px" },
  lg: { padding: "12px 24px", fontSize: "14px", borderRadius: "10px" },
}

export function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}: AdminButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled || loading ? 0.6 : 1,
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  )
}
