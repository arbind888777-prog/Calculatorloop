"use client"

import { useState, useEffect } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { PageLoader } from "@/components/admin/ui/Spinner"

interface ActivityItem {
  id: string
  action: string
  entityType?: string
  entityId?: string
  details?: string
  userName: string
  createdAt: string
}

// ── Stat Card ─────────────────────────────────────
function StatCard({ icon, label, value, desc, color }: {
  icon: string; label: string; value: string; desc: string; color: string
}) {
  return (
    <div style={{
      background: "#131d2e", border: "1px solid #1c2a3d", borderRadius: "14px",
      padding: "20px", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: color, borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: "24px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "26px", fontWeight: 800, color: "#e2e8f0", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "12px", fontWeight: 600, color, marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "#475569" }}>{desc}</div>
    </div>
  )
}

// ── Action Icon ───────────────────────────────────
function actionIcon(action: string) {
  if (action.includes("creat") || action.includes("add")) return { icon: "✨", color: "#10b981" }
  if (action.includes("updat") || action.includes("edit")) return { icon: "📝", color: "#3b82f6" }
  if (action.includes("delet") || action.includes("remov")) return { icon: "🗑️", color: "#ef4444" }
  if (action.includes("publish")) return { icon: "🚀", color: "#22c55e" }
  if (action.includes("login") || action.includes("auth")) return { icon: "🔑", color: "#f59e0b" }
  return { icon: "📌", color: "#6366f1" }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/admin/recent-activity")
        const data = await res.json()
        setActivities(Array.isArray(data) ? data : [])
      } catch { console.error("Failed to fetch activity logs") }
      setLoading(false)
    }
    fetchActivity()
  }, [])

  // Action type stats from activities
  const actionStats = activities.reduce((acc, a) => {
    const type = a.action.includes("creat") || a.action.includes("add") ? "create"
               : a.action.includes("updat") || a.action.includes("edit") ? "update"
               : a.action.includes("delet") ? "delete"
               : "other"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Analytics Tools Status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "12px" }}>
        <StatCard icon="📊" label="Vercel Analytics" value="Active" desc="Real-time traffic" color="#3b82f6" />
        <StatCard icon="🔍" label="MS Clarity" value="Active" desc="Heatmaps & sessions" color="#a855f7" />
        <StatCard icon="🤖" label="Robots.txt" value="OK" desc="Crawl rules set" color="#22c55e" />
        <StatCard icon="🗺️" label="Sitemap" value="Live" desc="Auto-generated" color="#f59e0b" />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>

        {/* Analytics Integrations */}
        <AdminCard title="Analytics Integrations" subtitle="Tracking tools currently active on your platform">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "16px", marginTop: "12px" }}>
            {[
              {
                name: "Vercel Analytics", icon: "📊", status: "Active", statusColor: "#22c55e",
                desc: "Page views, sessions, and performance insights. Built-in with your deployment.",
                link: "https://vercel.com/analytics", linkLabel: "Open Dashboard ↗"
              },
              {
                name: "Microsoft Clarity", icon: "🔍", status: "Active", statusColor: "#22c55e",
                desc: "Heatmaps, session recordings, and rage-click detection for UX insights.",
                link: "https://clarity.microsoft.com", linkLabel: "Open Clarity ↗"
              },
              {
                name: "Google Search Console", icon: "🌐", status: "Recommended", statusColor: "#f59e0b",
                desc: "Track SERP positions, impressions, and indexing status for all pages.",
                link: "https://search.google.com/search-console", linkLabel: "Setup Now ↗"
              },
            ].map(tool => (
              <div key={tool.name} style={{
                background: "#0f1623", border: "1px solid #1c2a3d", borderRadius: "12px", padding: "20px"
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{tool.icon}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{tool.name}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: tool.statusColor,
                    background: `${tool.statusColor}18`, padding: "2px 8px", borderRadius: "999px",
                    border: `1px solid ${tool.statusColor}40`
                  }}>{tool.status}</div>
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                  {tool.desc}
                </p>
                <a href={tool.link} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>
                  {tool.linkLabel}
                </a>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Activity Log */}
        <AdminCard title="System Activity Log" subtitle={`${activities.length} recent actions`}>
          {loading ? (
            <PageLoader message="Loading activity..." />
          ) : activities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#5a7090" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
              No recent activity to show.
            </div>
          ) : (
            <>
              {/* Activity type bar */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[
                  { key: "create", label: "Creates", color: "#10b981" },
                  { key: "update", label: "Updates", color: "#3b82f6" },
                  { key: "delete", label: "Deletes", color: "#ef4444" },
                  { key: "other",  label: "Other",   color: "#6366f1" },
                ].map(type => (
                  <div key={type.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: type.color }} />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{type.label}: <strong style={{ color: "#94a3b8" }}>{actionStats[type.key] || 0}</strong></span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {activities.map((item, idx) => {
                  const { icon, color } = actionIcon(item.action)
                  const isLast = idx === activities.length - 1
                  return (
                    <div key={item.id} style={{ display: "flex", gap: "14px", paddingBottom: isLast ? "0" : "16px", position: "relative" }}>
                      {/* Timeline line */}
                      {!isLast && (
                        <div style={{ position: "absolute", left: "16px", top: "32px", bottom: "0", width: "1px", background: "#1c2a3d" }} />
                      )}
                      {/* Icon circle */}
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                        background: `${color}18`, border: `1px solid ${color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", zIndex: 1
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.4 }}>
                          <strong style={{ color: "#60a5fa" }}>{item.userName}</strong>
                          {" "}{item.action.replace(/_/g, " ")}
                          {item.entityType && <span style={{ color: "#94a3b8" }}> · {item.entityType}</span>}
                        </p>
                        {item.details && (
                          <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#475569" }}>{item.details}</p>
                        )}
                        <p style={{ margin: 0, fontSize: "11px", color: "#334155" }}>
                          {timeAgo(item.createdAt)} · {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
