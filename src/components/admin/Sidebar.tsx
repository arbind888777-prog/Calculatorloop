"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"

// ── Navigation structure with groups ──────────────────────────────────────────
const navGroups = [
  {
    label: "Overview",
    items: [
      { icon: "⚡", label: "Dashboard", href: "/admin" },
      { icon: "📊", label: "Analytics", href: "/admin/analytics" },
    ],
  },
  {
    label: "Content",
    items: [
      { icon: "🧮", label: "Calculators", href: "/admin/calculators" },
      { icon: "📝", label: "Blog Manager", href: "/admin/blog" },
      { icon: "🌍", label: "SEO & Languages", href: "/admin/seo" },
      { icon: "🤖", label: "AI Tools", href: "/admin/ai" },
    ],
  },
  {
    label: "Users & Revenue",
    items: [
      { icon: "👥", label: "Users", href: "/admin/users" },
      { icon: "📫", label: "Subscribers", href: "/admin/subscribers" },
      { icon: "💰", label: "Revenue", href: "/admin/revenue" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: "🔌", label: "API Keys", href: "/admin/api-keys" },
      { icon: "⚙️", label: "Settings", href: "/admin/settings" },
    ],
  },
]

interface SidebarProps {
  isOpen?: boolean
  isCollapsed?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
  sidebarWidth?: number
}

export function Sidebar({
  isOpen = false,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
  sidebarWidth = 240,
}: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* ── DESKTOP sidebar ── */}
      <aside
        className="sidebar-desktop"
        style={{ width: `${sidebarWidth}px` }}
      >
        <SidebarInner
          pathname={pathname}
          session={session}
          isActive={isActive}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* ── MOBILE sidebar (slides in) ── */}
      <aside className={`sidebar-mobile ${isOpen ? "sidebar-mobile--open" : ""}`}>
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          aria-label="Close menu"
        >
          ✕
        </button>
        <SidebarInner
          pathname={pathname}
          session={session}
          isActive={isActive}
          isCollapsed={false}
          onNavClick={onClose}
        />
      </aside>

      <style>{`
        /* ── Base sidebar styles ── */
        .sidebar-desktop,
        .sidebar-mobile {
          background: linear-gradient(180deg, #0a1120 0%, #0d1526 100%);
          border-right: 1px solid #1c2a3d;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          overflow: hidden;
          z-index: 999;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Desktop: always visible ── */
        .sidebar-desktop {
          transform: translateX(0);
        }

        /* ── Mobile: hidden by default ── */
        .sidebar-mobile {
          width: 270px !important;
          transform: translateX(-100%);
          box-shadow: none;
        }
        .sidebar-mobile--open {
          transform: translateX(0);
          box-shadow: 6px 0 40px rgba(0, 0, 0, 0.6);
        }

        /* Close button */
        .sidebar-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid #1c2a3d;
          border-radius: 8px;
          color: #7a8ba4;
          font-size: 16px;
          width: 30px;
          height: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-close-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #f87171;
          border-color: rgba(239,68,68,0.2);
        }

        /* Nav link hover */
        .sidebar-nav-link:hover {
          background: rgba(59,130,246,0.08) !important;
          color: #94a3b8 !important;
        }

        /* Collapse toggle button */
        .sidebar-collapse-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid #1c2a3d;
          border-radius: 8px;
          color: #5a7090;
          font-size: 14px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, transform 0.3s;
        }
        .sidebar-collapse-btn:hover {
          background: rgba(59,130,246,0.12);
          color: #3b82f6;
          border-color: rgba(59,130,246,0.25);
        }

        /* Logout button */
        .sidebar-logout-btn {
          width: 100%;
          padding: 8px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.13);
          border-radius: 8px;
          color: #f87171;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .sidebar-logout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
        }

        /* ── Responsive visibility ── */
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </>
  )
}

// ── Inner content (shared by desktop & mobile) ─────────────────────────────────
function SidebarInner({
  pathname,
  session,
  isActive,
  isCollapsed = false,
  onNavClick,
  onToggleCollapse,
}: {
  pathname: string
  session: any
  isActive: (href: string) => boolean
  isCollapsed?: boolean
  onNavClick?: () => void
  onToggleCollapse?: () => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Logo ── */}
      <div
        style={{
          padding: isCollapsed ? "18px 12px" : "18px 16px",
          borderBottom: "1px solid #1c2a3d",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <Link
          href="/admin"
          onClick={onNavClick}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          {!isCollapsed && (
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  letterSpacing: "-0.3px",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                CalculatorLoop
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "9px",
                  color: "#4a6080",
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle — desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="sidebar-collapse-btn"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand" : "Collapse"}
            style={{ transform: isCollapsed ? "rotate(180deg)" : "none" }}
          >
            ◀
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        style={{
          flex: 1,
          padding: isCollapsed ? "10px 8px" : "10px 8px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: "4px" }}>
            {/* Group label */}
            {!isCollapsed && (
              <div
                style={{
                  padding: "10px 10px 4px",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#2a3f5f",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                }}
              >
                {group.label}
              </div>
            )}
            {isCollapsed && (
              <div style={{ height: "1px", background: "#1c2a3d", margin: "8px 6px 4px" }} />
            )}

            {group.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className="sidebar-nav-link"
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: isCollapsed ? "10px 0" : "9px 10px",
                    marginBottom: "2px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#e2e8f0" : "#6a8099",
                    background: active ? "rgba(59,130,246,0.14)" : "transparent",
                    border: active ? "1px solid rgba(59,130,246,0.22)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                    position: "relative",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    overflow: "hidden",
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "3px",
                        height: "18px",
                        background: "linear-gradient(180deg, #3b82f6, #8b5cf6)",
                        borderRadius: "0 3px 3px 0",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <span
                    style={{
                      fontSize: "16px",
                      width: "20px",
                      textAlign: "center",
                      flexShrink: 0,
                      filter: active ? "none" : "grayscale(0.2) opacity(0.75)",
                    }}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  {!isCollapsed && (
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  )}

                  {/* Active dot */}
                  {active && !isCollapsed && (
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#3b82f6",
                        flexShrink: 0,
                        animation: "pulse-dot 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User info + Logout ── */}
      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
            borderTop: "1px solid #1a2640",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "8px",
              padding: "8px 10px",
              borderRadius: "10px",
              background: "rgba(59,130,246,0.04)",
              border: "1px solid #1c2a3d",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                color: "#fff",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                flexShrink: 0,
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
                  color: "#4a6080",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {(session?.user as any)?.role || "ADMIN"}
              </p>
            </div>
            {/* Online indicator */}
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
                animation: "pulse-dot 2.5s ease-in-out infinite",
                boxShadow: "0 0 6px rgba(34,197,94,0.5)",
              }}
            />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="sidebar-logout-btn"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}

      {/* Collapsed: just avatar + logout icon */}
      {isCollapsed && (
        <div style={{ padding: "10px 8px", borderTop: "1px solid #1a2640", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div
            title={session?.user?.name || "Admin"}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              color: "#fff",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
            }}
          >
            {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            title="Sign Out"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "14px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.18)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)"
            }}
          >
            🚪
          </button>
        </div>
      )}
    </div>
  )
}
