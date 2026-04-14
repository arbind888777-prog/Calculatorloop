import React from "react"

interface AdminCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  action?: React.ReactNode
  noPadding?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AdminCard({
  children,
  title,
  subtitle,
  action,
  noPadding = false,
  style,
}: AdminCardProps) {
  return (
    <div
      style={{
        background: "#131d2e",
        borderRadius: "12px",
        border: "1px solid #1c2a3d",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #1c2a3d",
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#e2e8f0",
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "12px",
                  color: "#5a7090",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: "20px" }}>{children}</div>
    </div>
  )
}
