"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return val
}

const statCards = [
  {
    key: "totalCalculators",
    label: "Total Calculators",
    icon: "🧮",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.1)",
    borderColor: "rgba(59,130,246,0.2)",
    trend: "+12%",
    trendUp: true,
    sparkData: [40, 45, 55, 50, 60, 65, 70],
  },
  {
    key: "dailyActiveUsers",
    label: "Daily Active Users",
    icon: "👥",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.2)",
    trend: "+8%",
    trendUp: true,
    sparkData: [30, 38, 35, 42, 40, 48, 52],
  },
  {
    key: "monthlyRevenue",
    label: "Monthly Revenue",
    icon: "💰",
    color: "#eab308",
    bgColor: "rgba(234,179,8,0.1)",
    borderColor: "rgba(234,179,8,0.2)",
    prefix: "$",
    trend: "+5%",
    trendUp: true,
    sparkData: [20, 25, 22, 28, 30, 27, 35],
  },
  {
    key: "totalBlogPosts",
    label: "Total Blog Posts",
    icon: "📝",
    color: "#a855f7",
    bgColor: "rgba(168,85,247,0.1)",
    borderColor: "rgba(168,85,247,0.2)",
    trend: "+3",
    trendUp: true,
    sparkData: [10, 12, 14, 13, 16, 18, 20],
  },
]

const quickActions = [
  { icon: "➕", label: "New Calculator", href: "/admin/calculators", color: "#3b82f6" },
  { icon: "✍️", label: "New Blog Post", href: "/admin/blog/new", color: "#a855f7" },
  { icon: "👥", label: "Manage Users", href: "/admin/users", color: "#22c55e" },
  { icon: "📊", label: "Analytics", href: "/admin/analytics", color: "#eab308" },
]

const systemHealthItems = [
  { label: "Server Uptime", value: "99.9%", color: "#22c55e", bar: 99 },
  { label: "Avg Page Speed", value: "1.2s", color: "#3b82f6", bar: 88 },
  { label: "API Response", value: "~120ms", color: "#22c55e", bar: 92 },
  { label: "Cache Hit Rate", value: "94%", color: "#22c55e", bar: 94 },
  { label: "SEO Avg Score", value: "87/100", color: "#eab308", bar: 87 },
]

// Tiny sparkline SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const w = 80, h = 32
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
    </svg>
  )
}

// Weekly bar chart (pure CSS)
function WeeklyChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const values = [65, 80, 72, 90, 85, 60, 45]
  const max = Math.max(...values)
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
        {days.map((day, i) => (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "100%",
                height: `${(values[i] / max) * 70}px`,
                background: i === 3
                  ? "linear-gradient(180deg, #3b82f6, #8b5cf6)"
                  : "rgba(59,130,246,0.25)",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.8s ease",
                cursor: "pointer",
                position: "relative",
              }}
              title={`${values[i]}%`}
            />
            <span style={{ fontSize: "9px", color: "#5a7090", fontWeight: 500 }}>{day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatActionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getActionDotColor(action: string): string {
  if (action.includes("delet")) return "#ef4444"
  if (action.includes("creat") || action.includes("publish")) return "#22c55e"
  if (action.includes("updat") || action.includes("edit")) return "#3b82f6"
  return "#eab308"
}

function getEntityBadgeStyle(entityType: string | null): React.CSSProperties {
  const map: Record<string, string> = {
    BlogPost: "#a855f7",
    Calculator: "#3b82f6",
    User: "#f97316",
    ApiKey: "#22c55e",
  }
  return {
    fontSize: "9px",
    fontWeight: 600,
    padding: "1px 5px",
    borderRadius: "4px",
    background: `${map[entityType ?? ""] ?? "#5a7090"}22`,
    color: map[entityType ?? ""] ?? "#5a7090",
    border: `1px solid ${map[entityType ?? ""] ?? "#5a7090"}44`,
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  }
}

// Single stat card
function StatCard({ card, value }: { card: typeof statCards[0]; value: number }) {
  const animated = useCountUp(value)
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #131d2e 0%, #0f1623 100%)",
        borderRadius: "14px",
        border: `1px solid ${card.borderColor}`,
        padding: "20px",
        transition: "all 0.25s ease",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)"
        e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}22`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: card.color,
          opacity: 0.06,
          filter: "blur(20px)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: card.bgColor,
            border: `1px solid ${card.borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {card.icon}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "12px", color: card.trendUp ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {card.trendUp ? "↑" : "↓"} {card.trend}
          </span>
        </div>
      </div>

      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#5a7090", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {card.label}
      </p>
      <p style={{ margin: "0 0 12px 0", fontSize: "30px", fontWeight: 800, color: "#e2e8f0", letterSpacing: "-1.5px", lineHeight: 1 }}>
        {(card as any).prefix || ""}{animated.toLocaleString()}
      </p>

      {/* Sparkline */}
      <div style={{ opacity: 0.7 }}>
        <Sparkline data={card.sparkData} color={card.color} />
      </div>
    </div>
  )
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [greeting, setGreeting] = useState("Good morning")
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting("Good morning")
    else if (h < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Welcome banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(34,197,94,0.05) 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(59,130,246,0.2)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-30px", right: "60px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(139,92,246,0.08)", filter: "blur(20px)" }} />
        <div style={{ position: "absolute", bottom: "-20px", right: "20px", width: "60px", height: "60px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", filter: "blur(16px)" }} />

        <div style={{ position: "relative" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>
            {greeting}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#7a8ba4" }}>
            Here&apos;s what&apos;s happening on your CalculatorLoop platform today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/admin/blog/new" style={{ textDecoration: "none" }}>
            <AdminButton variant="primary" size="sm">✍️ New Blog Post</AdminButton>
          </Link>
          <Link href="/admin/calculators" style={{ textDecoration: "none" }}>
            <AdminButton variant="outline" size="sm">🧮 Calculators</AdminButton>
          </Link>
        </div>
      </div>

      {/* Stats cards row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
        className="admin-stats-grid"
      >
        {statCards.map((card) => {
          const value = data.stats[card.key as keyof typeof data.stats]
          return <StatCard key={card.key} card={card} value={typeof value === "number" ? value : 0} />
        })}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}
        className="admin-quick-grid"
      >
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "#131d2e",
                borderRadius: "12px",
                border: "1px solid #1c2a3d",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#192536"
                e.currentTarget.style.borderColor = action.color + "44"
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}15`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#131d2e"
                e.currentTarget.style.borderColor = "#1c2a3d"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: action.color + "18",
                  border: `1px solid ${action.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </div>
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
        className="admin-bottom-grid"
      >
        {/* System Health */}
        <AdminCard title="System Health" subtitle="Real-time status">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {systemHealthItems.map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#7a8ba4" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: item.color }}>
                    {item.value}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: "4px", background: "#1c2a3d", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${item.bar}%`,
                      background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                      borderRadius: "4px",
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Weekly Traffic Chart */}
        <AdminCard title="Weekly Traffic" subtitle="Visitor activity this week">
          <WeeklyChart />
          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#e2e8f0" }}>
                {(data.stats.dailyActiveUsers * 7).toLocaleString()}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#5a7090" }}>Total this week</p>
            </div>
            <Badge color="green" dot>Live</Badge>
          </div>
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
                      width: "22px",
                      height: "22px",
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
                        i === 0 ? "#eab308" : i === 1 ? "#94a3b8" : i === 2 ? "#d97706" : "#5a7090",
                      flexShrink: 0,
                    }}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
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
                  <span style={{ fontSize: "11px", color: "#5a7090", fontWeight: 500, flexShrink: 0 }}>
                    {calc.totalUses.toLocaleString()}
                  </span>
                  <Badge color={calc.isActive ? "green" : "red"} dot>
                    {calc.isActive ? "On" : "Off"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Recent Activity */}
      <AdminCard title="Recent Activity" subtitle="Last 10 admin actions">
        {data.recentActivity.length === 0 ? (
          <p style={{ color: "#5a7090", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
            No recent activity yet.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
              className="admin-activity-grid"
            >
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "rgba(28,42,61,0.3)",
                    border: "1px solid rgba(28,42,61,0.5)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(28,42,61,0.3)")}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: getActionDotColor(activity.action),
                      marginTop: "4px",
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${getActionDotColor(activity.action)}88`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#e2e8f0" }}>
                      <strong>{activity.userName}</strong>{" "}
                      {formatActionLabel(activity.action)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                      <span style={{ fontSize: "10px", color: "#5a7090" }}>
                        {timeAgo(activity.createdAt)}
                      </span>
                      {activity.entityType && (
                        <span style={getEntityBadgeStyle(activity.entityType)}>
                          {activity.entityType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/analytics" style={{ textDecoration: "none", display: "block", marginTop: "12px" }}>
              <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 500 }}>View all activity →</span>
            </Link>
          </>
        )}
      </AdminCard>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-quick-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-bottom-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-activity-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-quick-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
