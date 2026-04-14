import React from "react"

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  counter?: { current: number; max: number }
}

export function AdminInput({
  label,
  hint,
  error,
  counter,
  id,
  style,
  ...props
}: AdminInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <label
            htmlFor={inputId}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#94a3b8",
            }}
          >
            {label}
          </label>
          {counter && (
            <span
              style={{
                fontSize: "11px",
                color: counter.current > counter.max ? "#ef4444" : "#5a7090",
                fontWeight: 500,
              }}
            >
              {counter.current}/{counter.max}
            </span>
          )}
        </div>
      )}
      <input
        id={inputId}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#0f1623",
          border: `1px solid ${error ? "#ef4444" : "#1c2a3d"}`,
          borderRadius: "8px",
          color: "#e2e8f0",
          fontSize: "13px",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxSizing: "border-box",
          fontFamily: "inherit",
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#3b82f6"
          e.target.style.boxShadow = `0 0 0 3px ${error ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)"}`
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#1c2a3d"
          e.target.style.boxShadow = "none"
        }}
        {...props}
      />
      {hint && !error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#5a7090" }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  counter?: { current: number; max: number }
}

export function AdminTextarea({
  label,
  hint,
  error,
  counter,
  id,
  style,
  ...props
}: AdminTextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <label
            htmlFor={inputId}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#94a3b8",
            }}
          >
            {label}
          </label>
          {counter && (
            <span
              style={{
                fontSize: "11px",
                color: counter.current > counter.max ? "#ef4444" : "#5a7090",
                fontWeight: 500,
              }}
            >
              {counter.current}/{counter.max}
            </span>
          )}
        </div>
      )}
      <textarea
        id={inputId}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#0f1623",
          border: `1px solid ${error ? "#ef4444" : "#1c2a3d"}`,
          borderRadius: "8px",
          color: "#e2e8f0",
          fontSize: "13px",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          resize: "vertical",
          minHeight: "80px",
          boxSizing: "border-box",
          fontFamily: "inherit",
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#3b82f6"
          e.target.style.boxShadow = `0 0 0 3px ${error ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)"}`
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#1c2a3d"
          e.target.style.boxShadow = "none"
        }}
        {...props}
      />
      {hint && !error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#5a7090" }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  )
}
