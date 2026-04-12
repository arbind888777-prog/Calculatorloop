import React from "react"

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export function AdminSelect({
  label,
  hint,
  error,
  options,
  id,
  style,
  ...props
}: AdminSelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div style={{ marginBottom: "16px" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          {label}
        </label>
      )}
      <select
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
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%235a7090' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "36px",
          fontFamily: "inherit",
          boxSizing: "border-box",
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#5a7090" }}>{hint}</p>
      )}
      {error && (
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#ef4444" }}>{error}</p>
      )}
    </div>
  )
}
