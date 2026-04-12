"use client"

import Link from "next/link"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"

interface DashboardData {
  stats: {
    totalCalculators: number
    totalBlogPosts: number
    publishedBlogs: number
    totalUsers: number
    dailyActiveUsers: number
    monthlyRevenue: number
  }
  recentActivity: {
    id: string
    action: string
    entityType: string | null
    entityId: string | null
    details: string | null
    userName: string
    createdAt: string
  }[]
  topCalculators: {
    id: string
    slug: string
    name: string
    totalUses: number
    isActive: boolean
  }[]
}

const statCards = [
  {
    key: "totalCalculators",
    label: "Total Calculators",
    icon: "🧮",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.1)",
  },
  {
    key: "dailyActiveUsers",
    label: "Daily Active Users",
    icon: "👥",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.1)",
  },
  {
    key: "monthlyRevenue",
    label: "Monthly Revenue",
    icon: "💰",
    color: "#eab308",
    bgColor: "rgba(234,179,8,0.1)",
    prefix: "$",
  },
  {
    key: "totalBlogPosts",
    label: "Total Blog Posts",
    icon: "📝",
    color: "#a855f7",
    bgColor: "rgba(168,85,247,0.1)",
  },
]

const quickActions = [
  { icon: "➕", label: "New Calculator", href: "/admin/calculators" },
  { icon: "✍️", label: "New Blog Post", href: "/admin/blog/new" },
  { icon: "🌍", label: "Add Language", href: "/admin/seo" },
  { icon: "📊", label: "Export Report", href: "/admin/analytics" },
]

const systemHealthItems = [
  { label: "Server Uptime", value: "99.9%", color: "#22c55e" },
  { label: "Avg Page Speed", value: "1.2s", color: "#3b82f6" },
  { label: "API Response Time", value: "~120ms", color: "#22c55e" },
  { label: "Cache Hit Rate", value: "94%", color: "#22c55e" },
  { label: "SEO Avg Score", value: "87/100", color: "#eab308" },
]

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div>
      {/* Welcome banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.08) 100%)",
          borderRadius: "12px",
          border: "1px solid rgba(59,130,246,0.15)",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>
            Welcome back! 👋
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#7a8ba4" }}>
            Here&apos;s an overview of your CalculatorLoop platform.
          </p>
        </div>
        <Link href="/admin/blog/new">
          <AdminButton variant="primary" size="sm">
            ✍️ New Blog Post
          </AdminButton>
        </Link>
      </div>

      {/* Stats cards row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {statCards.map((card) => {
          const value = data.stats[card.key as keyof typeof data.stats]
          return (
            <div
              key={card.key}
              style={{
                background: "#131d2e",
                borderRadius: "12px",
                border: "1px solid #1c2a3d",
                padding: "20px",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1c2a3d"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: card.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  {card.icon}
                </div>
                <Badge color="green" dot>
                  Live
                </Badge>
              </div>
              <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "#5a7090", fontWeight: 500 }}>
                {card.label}
              </p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#e2e8f0", letterSpacing: "-1px" }}>
                {(card as any).prefix || ""}{typeof value === "number" ? value.toLocaleString() : value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "#131d2e",
                borderRadius: "10px",
                border: "1px solid #1c2a3d",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#192536"
                e.currentTarget.style.borderColor = "#2a3f5f"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#131d2e"
                e.currentTarget.style.borderColor = "#1c2a3d"
              }}
            >
              <span style={{ fontSize: "18px" }}>{action.icon}</span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#94a3b8" }}>
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid: 3 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        {/* System Health */}
        <AdminCard title="System Health" subtitle="Real-time status">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {systemHealthItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(28,42,61,0.4)",
                }}
              >
                <span style={{ fontSize: "12px", color: "#7a8ba4" }}>{item.label}</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: item.color,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Recent Activity */}
        <AdminCard title="Recent Activity" subtitle="Last 10 actions">
          {data.recentActivity.length === 0 ? (
            <p style={{ color: "#5a7090", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No recent activity yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(28,42,61,0.3)",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      marginTop: "6px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#e2e8f0" }}>
                      <strong>{activity.userName}</strong>{" "}
                      {formatActionLabel(activity.action)}
                    </p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#5a7090" }}>
                      {timeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Top Calculators */}
        <AdminCard title="Top Calculators" subtitle="By usage">
          {data.topCalculators.length === 0 ? (
            <p style={{ color: "#5a7090", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No calculator data yet. Import calculators to see stats.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {data.topCalculators.map((calc, i) => (
                <div
                  key={calc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(28,42,61,0.3)",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "6px",
                      background:
                        i === 0
                          ? "rgba(234,179,8,0.15)"
                          : i === 1
                          ? "rgba(148,163,184,0.15)"
                          : i === 2
                          ? "rgba(180,83,9,0.15)"
                          : "rgba(59,130,246,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      color:
                        i === 0
                          ? "#eab308"
                          : i === 1
                          ? "#94a3b8"
                          : i === 2
                          ? "#d97706"
                          : "#5a7090",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#e2e8f0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {calc.name}
                    </p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#5a7090", fontWeight: 500 }}>
                    {calc.totalUses.toLocaleString()} uses
                  </span>
                  <Badge color={calc.isActive ? "green" : "red"} dot>
                    {calc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
