"use client"

import { SessionProvider } from "next-auth/react"
import { Sidebar } from "@/components/admin/Sidebar"
import { TopBar } from "@/components/admin/TopBar"
import { useState, useEffect } from "react"

const SIDEBAR_WIDTH = 240

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  const effectiveWidth = sidebarCollapsed ? 64 : SIDEBAR_WIDTH

  return (
    <SessionProvider>
      <div className="admin-root">
        {/* Mobile overlay backdrop */}
        <div
          className={`admin-overlay ${sidebarOpen ? "admin-overlay--visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          sidebarWidth={effectiveWidth}
        />

        {/* Main content area */}
        <div
          className="admin-main"
          style={{ "--sidebar-w": `${effectiveWidth}px` } as React.CSSProperties}
        >
          <TopBar
            onMenuClick={() => setSidebarOpen((o) => !o)}
            isCollapsed={sidebarCollapsed}
          />
          <main className="admin-page-content">
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .admin-root {
          display: flex;
          min-height: 100vh;
          background: #080d1a;
          font-family: 'DM Sans', 'Inter', system-ui, -apple-system, sans-serif;
          color: #e2e8f0;
          position: relative;
        }

        /* Overlay */
        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 998;
          backdrop-filter: blur(3px);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .admin-overlay--visible {
          display: block;
          opacity: 1;
          animation: fadeIn 0.2s ease forwards;
        }

        /* Main content */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
          margin-left: var(--sidebar-w, 240px);
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-page-content {
          flex: 1;
          padding: 24px 28px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1c2a3d; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a3f5f; }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* ── TABLET (769px – 1024px) ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .admin-page-content { padding: 20px 20px; }
        }

        /* ── MOBILE (≤ 768px) ── */
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-page-content {
            padding: 16px 14px;
          }
        }
      `}</style>
    </SessionProvider>
  )
}
