"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"

// ── Page title map ─────────────────────────────────────────────────────────────
const pageTitles: Record<string, { title: string; icon: string; parent?: string }> = {
  "/admin":               { title: "Dashboard",         icon: "⚡" },
  "/admin/calculators":   { title: "Calculators",       icon: "🧮", parent: "Dashboard" },
  "/admin/blog":          { title: "Blog Manager",      icon: "📝", parent: "Dashboard" },
  "/admin/blog/new":      { title: "New Blog Post",     icon: "✍️", parent: "Blog Manager" },
  "/admin/seo":           { title: "SEO & Languages",   icon: "🌍", parent: "Dashboard" },
  "/admin/ai":            { title: "AI Tools",          icon: "🤖", parent: "Dashboard" },
  "/admin/users":         { title: "Users",             icon: "👥", parent: "Dashboard" },
  "/admin/subscribers":   { title: "Subscribers",       icon: "📫", parent: "Dashboard" },
  "/admin/revenue":       { title: "Revenue",           icon: "💰", parent: "Dashboard" },
  "/admin/analytics":     { title: "Analytics",         icon: "📊", parent: "Dashboard" },
  "/admin/api-keys":      { title: "API Keys",          icon: "🔌", parent: "Settings" },
  "/admin/settings":      { title: "Settings",          icon: "⚙️", parent: "Dashboard" },
}

interface TopBarProps {
  onMenuClick?: () => void
  isCollapsed?: boolean
}

export function TopBar({ onMenuClick, isCollapsed }: TopBarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const notifRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }))
      setDate(now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }))
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  // Close notif on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Auto-focus mobile search
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [mobileSearchOpen])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setMobileSearchOpen(true)
      }
      if (e.key === "Escape") {
        setMobileSearchOpen(false)
        setNotifOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Resolve current page info
  const pageInfo = Object.entries(pageTitles)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => pathname.startsWith(path))?.[1]

  const title = pageInfo?.title ?? "Admin"
  const icon  = pageInfo?.icon  ?? "⚡"
  const parent = pageInfo?.parent

  return (
    <>
      <header className="topbar">
        {/* ── Left: hamburger + breadcrumb ── */}
        <div className="topbar-left">
          {/* Hamburger (mobile) */}
          <button
            onClick={onMenuClick}
            className="topbar-hamburger"
            aria-label="Toggle menu"
          >
            <span className="ham-line" style={{ width: "16px" }} />
            <span className="ham-line" style={{ width: "11px" }} />
            <span className="ham-line" style={{ width: "16px" }} />
          </button>

          {/* Breadcrumb */}
          <div className="topbar-breadcrumb">
            {parent && (
              <>
                <span className="breadcrumb-parent">{parent}</span>
                <span className="breadcrumb-sep">›</span>
              </>
            )}
            <span className="breadcrumb-icon">{icon}</span>
            <h1 className="topbar-title">{title}</h1>
          </div>
        </div>

        {/* ── Right: date/time, search, notif, avatar ── */}
        <div className="topbar-right">
          {/* Date & time — hidden on mobile */}
          <div className="topbar-datetime">
            <span className="topbar-time">{time}</span>
            <span className="topbar-date">{date}</span>
          </div>

          {/* Search bar — hidden on mobile */}
          <div className="topbar-search-wrap">
            <span className="topbar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search… (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
          </div>

          {/* Mobile search icon */}
          <button
            className="topbar-icon-btn topbar-mobile-search-btn"
            aria-label="Search"
            onClick={() => setMobileSearchOpen(true)}
          >
            🔍
          </button>

          {/* Notification bell */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className={`topbar-icon-btn ${notifOpen ? "topbar-icon-btn--active" : ""}`}
              aria-label="Notifications"
              style={{ position: "relative" }}
            >
              🔔
              <span className="notif-badge" />
            </button>

            {/* Dropdown */}
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-header-title">Notifications</span>
                  <span className="notif-count-chip">3 new</span>
                </div>
                {[
                  { icon: "🧮", text: "Calculator synced successfully", time: "2m ago" },
                  { icon: "📝", text: "New blog post published",        time: "1h ago" },
                  { icon: "👥", text: "New user registered",            time: "3h ago" },
                ].map((n, i) => (
                  <div key={i} className="notif-item">
                    <span style={{ fontSize: "18px" }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notif-text">{n.text}</p>
                      <p className="notif-time">{n.time}</p>
                    </div>
                    <div className="notif-dot" />
                  </div>
                ))}
                <div className="notif-footer">
                  <Link href="/admin/analytics" className="notif-footer-link" onClick={() => setNotifOpen(false)}>
                    View all →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="topbar-user-chip">
            <div className="topbar-avatar">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <span className="topbar-user-name">
              {session?.user?.name ?? "Admin"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile search overlay ── */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay" onClick={() => setMobileSearchOpen(false)}>
          <div className="mobile-search-box" onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: "16px", color: "#5a7090", flexShrink: 0 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Type to search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="mobile-search-close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ── TopBar shell ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 58px;
          background: rgba(8, 13, 26, 0.97);
          border-bottom: 1px solid #1c2a3d;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(14px);
          gap: 12px;
          flex-shrink: 0;
        }

        /* Left */
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        /* Breadcrumb */
        .topbar-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .breadcrumb-parent {
          font-size: 12px;
          color: #3a5070;
          font-weight: 500;
          white-space: nowrap;
        }
        .breadcrumb-sep {
          font-size: 13px;
          color: #2a3f5f;
        }
        .breadcrumb-icon {
          font-size: 15px;
        }
        .topbar-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Right */
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Date/time */
        .topbar-datetime {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-right: 4px;
        }
        .topbar-time {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1;
        }
        .topbar-date {
          font-size: 10px;
          color: #3b82f6;
          font-weight: 500;
          margin-top: 1px;
        }

        /* Search */
        .topbar-search-wrap {
          position: relative;
        }
        .topbar-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #5a7090;
          pointer-events: none;
        }
        .topbar-search-input {
          width: 200px;
          padding: 7px 12px 7px 30px;
          background: #111827;
          border: 1px solid #1c2a3d;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 12px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, width 0.3s;
        }
        .topbar-search-input::placeholder { color: #3a5070; }
        .topbar-search-input:focus {
          border-color: #3b82f6;
          width: 240px;
        }

        /* Icon buttons */
        .topbar-icon-btn {
          background: #111827;
          border: 1px solid #1c2a3d;
          border-radius: 8px;
          padding: 0;
          cursor: pointer;
          font-size: 15px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
          line-height: 1;
        }
        .topbar-icon-btn:hover {
          background: #192536;
          border-color: #2a3f5f;
        }
        .topbar-icon-btn--active {
          background: #1c2a3d;
          border-color: #3b82f6;
        }

        /* Notif badge */
        .notif-badge {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid #111827;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        /* Notif dropdown */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          background: #0f1825;
          border: 1px solid #1c2a3d;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.55);
          z-index: 200;
          overflow: hidden;
          animation: countUp 0.18s ease;
        }
        .notif-header {
          padding: 13px 16px;
          border-bottom: 1px solid #1c2a3d;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .notif-header-title {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .notif-count-chip {
          font-size: 10px;
          background: rgba(59,130,246,0.14);
          color: #3b82f6;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 600;
        }
        .notif-item {
          padding: 11px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-bottom: 1px solid rgba(28,42,61,0.4);
          cursor: pointer;
          background: rgba(59,130,246,0.02);
          transition: background 0.15s;
        }
        .notif-item:hover { background: rgba(59,130,246,0.07); }
        .notif-text {
          margin: 0;
          font-size: 12px;
          color: #e2e8f0;
          font-weight: 500;
          line-height: 1.4;
        }
        .notif-time {
          margin: 2px 0 0;
          font-size: 10px;
          color: #4a6080;
        }
        .notif-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
          margin-top: 5px;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .notif-footer {
          padding: 9px 16px;
          text-align: center;
        }
        .notif-footer-link {
          font-size: 11px;
          color: #3b82f6;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .notif-footer-link:hover { color: #60a5fa; }

        /* User chip */
        .topbar-user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: #111827;
          border: 1px solid #1c2a3d;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
        }
        .topbar-user-chip:hover {
          background: #192536;
          border-color: #2a3f5f;
        }
        .topbar-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #fff;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
          flex-shrink: 0;
        }
        .topbar-user-name {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Hamburger */
        .topbar-hamburger {
          background: #111827;
          border: 1px solid #1c2a3d;
          border-radius: 8px;
          padding: 0;
          cursor: pointer;
          color: #94a3b8;
          display: none;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .topbar-hamburger:hover {
          background: #192536;
          border-color: #2a3f5f;
        }
        .ham-line {
          height: 1.5px;
          background: currentColor;
          border-radius: 2px;
          display: block;
        }

        /* Mobile search button */
        .topbar-mobile-search-btn { display: none; }

        /* Mobile search overlay */
        .mobile-search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 300;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          animation: fadeIn 0.18s ease;
        }
        .mobile-search-box {
          width: 90%;
          max-width: 520px;
          background: #0f1825;
          border: 1px solid #2a3f5f;
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          animation: countUp 0.2s ease;
        }
        .mobile-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 15px;
          font-family: inherit;
          outline: none;
        }
        .mobile-search-input::placeholder { color: #3a5070; }
        .mobile-search-close {
          background: rgba(255,255,255,0.05);
          border: 1px solid #1c2a3d;
          border-radius: 6px;
          color: #5a7090;
          font-size: 12px;
          width: 26px;
          height: 26px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .mobile-search-close:hover { background: rgba(239,68,68,0.1); color: #f87171; }

        /* ── TABLET ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .topbar-datetime { display: none; }
          .topbar-search-input { width: 160px; }
          .topbar-search-input:focus { width: 200px; }
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .topbar { padding: 0 14px; height: 54px; }
          .topbar-hamburger { display: flex; }
          .topbar-datetime { display: none; }
          .topbar-search-wrap { display: none; }
          .topbar-mobile-search-btn { display: flex; }
          .topbar-user-name { display: none; }
          .topbar-user-chip { padding: 4px; }
          .breadcrumb-parent,
          .breadcrumb-sep { display: none; }
          .notif-dropdown {
            right: -50px;
            width: 280px;
          }
        }

        @media (max-width: 400px) {
          .topbar { padding: 0 10px; gap: 6px; }
          .topbar-right { gap: 5px; }
        }
      `}</style>
    </>
  )
}
