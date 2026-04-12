"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

const navItems = [
  { icon: "⚡", label: "Dashboard", href: "/admin" },
  { icon: "🧮", label: "Calculators", href: "/admin/calculators" },
  { icon: "📝", label: "Blog Manager", href: "/admin/blog" },
  { icon: "🌍", label: "SEO & Languages", href: "/admin/seo" },
  { icon: "🤖", label: "AI Tools", href: "/admin/ai" },
  { icon: "👥", label: "Users", href: "/admin/users" },
  { icon: "📫", label: "Subscribers", href: "/admin/subscribers" },
  { icon: "💰", label: "Revenue", href: "/admin/revenue" },
  { icon: "📊", label: "Analytics", href: "/admin/analytics" },
  { icon: "🔌", label: "API Keys", href: "/admin/api-keys" },
  { icon: "⚙️", label: "Settings", href: "/admin/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "#0f1623",
        borderRight: "1px solid #1c2a3d",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid #1c2a3d",
        }}
      >
        <Link
          href="/admin"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚡</span>
          <div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "-0.3px",
              }}
            >
              CalculatorLoop
            </span>
            <span
              style={{
                display: "block",
                fontSize: "10px",
                color: "#5a7090",
                fontWeight: 500,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                marginBottom: "2px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                color: active ? "#e2e8f0" : "#7a8ba4",
                background: active
                  ? "rgba(59,130,246,0.12)"
                  : "transparent",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)"
                  e.currentTarget.style.color = "#94a3b8"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#7a8ba4"
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "20px",
                    background: "#3b82f6",
                    borderRadius: "0 4px 4px 0",
                  }}
                />
              )}
              <span style={{ fontSize: "16px", width: "22px", textAlign: "center" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #1c2a3d",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 600,
                color: "#e2e8f0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session?.user?.name || "Admin"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "#5a7090",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session?.user?.role || "ADMIN"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          style={{
            width: "100%",
            padding: "8px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "6px",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)"
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
