import React from "react"

interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 24, color = "#3b82f6" }: SpinnerProps) {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "adminSpin 0.8s linear infinite" }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="40 60"
          opacity={0.9}
        />
      </svg>
      <style>{`
        @keyframes adminSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

/**
 * Full-page loading state for admin pages.
 */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
        gap: "12px",
      }}
    >
      <Spinner size={32} />
      <p style={{ color: "#5a7090", fontSize: "13px", margin: 0 }}>{message}</p>
    </div>
  )
}
