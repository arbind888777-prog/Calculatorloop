"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/calculators": "Calculator Manager",
  "/admin/blog": "Blog Manager",
  "/admin/blog/new": "New Blog Post",
  "/admin/seo": "SEO & Languages",
  "/admin/ai": "AI Tools",
  "/admin/users": "User Management",
  "/admin/revenue": "Revenue",
  "/admin/analytics": "Analytics",
  "/admin/api": "API & Integrations",
  "/admin/settings": "Settings",
}

export function TopBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  // Find the best matching page title
  const title = Object.entries(pageTitles)
    .sort(([a], [b]) => b.length - a.length) // longest match first
    .find(([path]) => pathname.startsWith(path))?.[1] || "Admin"

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: "60px",
        background: "#0f1623",
        borderBottom: "1px solid #1c2a3d",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 700,
          color: "#e2e8f0",
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </h1>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Search bar */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "#5a7090",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "220px",
              padding: "8px 12px 8px 36px",
              background: "#131d2e",
              border: "1px solid #1c2a3d",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "12px",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6"
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#1c2a3d"
            }}
          />
        </div>

        {/* Notification bell */}
        <button
          style={{
            position: "relative",
            background: "#131d2e",
            border: "1px solid #1c2a3d",
            borderRadius: "8px",
            padding: "8px 10px",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1c2a3d"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#131d2e"
          }}
          aria-label="Notifications"
        >
          🔔
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "8px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#ef4444",
              border: "1.5px solid #131d2e",
            }}
          />
        </button>

        {/* User avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px 4px 4px",
            background: "#131d2e",
            border: "1px solid #1c2a3d",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
            {session?.user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  )
}
