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

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/admin/recent-activity")
        const data = await res.json()
        setActivities(data)
      } catch (err) {
        console.error("Failed to fetch activity logs")
      }
      setLoading(false)
    }
    fetchActivity()
  }, [])

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <AdminCard title="Analytics" subtitle="Connect Google Analytics or Vercel Analytics">
            <p style={{ color: "#5a7090", fontSize: "13px", lineHeight: 1.6 }}>
              Analytics dashboard will show traffic data once connected. You already have
              <strong style={{ color: "#60a5fa" }}> @vercel/analytics</strong> and
              <strong style={{ color: "#60a5fa" }}> Microsoft Clarity</strong> installed.
            </p>
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{
                background: "#0f1623", borderRadius: "8px", padding: "16px",
                border: "1px solid #1c2a3d", textAlign: "center",
              }}>
                <span style={{ fontSize: "32px" }}>📊</span>
                <p style={{ margin: "8px 0 0 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>Vercel Analytics</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#5a7090" }}>Already active</p>
              </div>
              <div style={{
                background: "#0f1623", borderRadius: "8px", padding: "16px",
                border: "1px solid #1c2a3d", textAlign: "center",
              }}>
                <span style={{ fontSize: "32px" }}>🔍</span>
                <p style={{ margin: "8px 0 0 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>Microsoft Clarity</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#5a7090" }}>Already active</p>
              </div>
            </div>
          </AdminCard>
        </div>

        <div>
          <AdminCard title="System Activity Log">
            {loading ? (
              <PageLoader message="Loading activity..." />
            ) : activities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: "12px" }}>
                    <div style={{ fontSize: "16px", marginTop: "2px" }}>
                      {item.action.includes("create") ? "✨" :
                       item.action.includes("update") ? "📝" :
                       item.action.includes("delete") ? "🗑️" :
                       item.action.includes("publish") ? "🚀" : "📌"}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.4 }}>
                        <strong style={{ color: "#3b82f6" }}>{item.userName}</strong>
                        {" "}{item.action.replace(/_/g, " ")}{" "}
                        {item.entityType && <span style={{ color: "#94a3b8" }}>{item.entityType}</span>}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#5a7090" }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#5a7090", fontSize: "13px", textAlign: "center", margin: "20px 0" }}>
                No recent activity.
              </p>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
