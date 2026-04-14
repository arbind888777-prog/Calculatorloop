"use client"

import { SessionProvider } from "next-auth/react"
import { Sidebar } from "@/components/admin/Sidebar"
import { TopBar } from "@/components/admin/TopBar"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#080d1a",
          fontFamily: "'DM Sans', 'Inter', system-ui, -apple-system, sans-serif",
          color: "#e2e8f0",
        }}
      >
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            marginLeft: "220px",
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <TopBar />
          <main
            style={{
              flex: 1,
              padding: "24px 28px",
              overflowY: "auto",
            }}
          >
            {children}
          </main>
        </div>

        {/* Global admin styles */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');

          /* Scrollbar styling for admin */
          .admin-scroll::-webkit-scrollbar,
          [style*="overflow"] ::-webkit-scrollbar {
            width: 6px;
          }
          [style*="overflow"] ::-webkit-scrollbar-track {
            background: transparent;
          }
          [style*="overflow"] ::-webkit-scrollbar-thumb {
            background: #1c2a3d;
            border-radius: 3px;
          }
          [style*="overflow"] ::-webkit-scrollbar-thumb:hover {
            background: #2a3f5f;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </SessionProvider>
  )
}
