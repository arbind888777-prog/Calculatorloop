"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"

interface ApiKeyItem {
  id: string
  clientName: string
  plan: string
  callsLimit: number
  callsUsed: number
  isActive: boolean
  createdAt: string
}

const planColors: Record<string, "gray" | "blue" | "purple" | "yellow"> = {
  FREE: "gray", STARTER: "blue", PRO: "purple", ENTERPRISE: "yellow",
}

export default function ApiManagementPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newPlan, setNewPlan] = useState("FREE")
  const [generatedKey, setGeneratedKey] = useState("")
  const [generating, setGenerating] = useState(false)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/api-keys")
      const data = await res.json()
      setKeys(data.keys || [])
    } catch {
      console.error("Failed to fetch API keys")
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleGenerate = async () => {
    if (!newClientName) return
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: newClientName, plan: newPlan }),
      })
      const data = await res.json()
      if (data.key) {
        setGeneratedKey(data.key)
        fetchKeys()
      }
    } catch {
      alert("Failed to generate key")
    }
    setGenerating(false)
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key?")) return
    await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" })
    fetchKeys()
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total API Keys", value: keys.length, icon: "🔑" },
          { label: "Active Keys", value: keys.filter((k) => k.isActive).length, icon: "✅" },
          { label: "Total Calls Today", value: keys.reduce((s, k) => s + k.callsUsed, 0).toLocaleString(), icon: "📊" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#131d2e", borderRadius: "10px", border: "1px solid #1c2a3d",
              padding: "16px", display: "flex", alignItems: "center", gap: "12px",
            }}
          >
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#e2e8f0" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#5a7090" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <AdminButton variant="primary" size="md" onClick={() => setShowGenerate(!showGenerate)}>
          🔑 Generate New API Key
        </AdminButton>
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <AdminCard title="Generate API Key" style={{ marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
            <AdminInput
              label="Client Name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="My App"
            />
            <AdminSelect
              label="Plan"
              options={[
                { value: "FREE", label: "Free (100/day)" },
                { value: "STARTER", label: "Starter (10K/month)" },
                { value: "PRO", label: "Pro (100K/month)" },
                { value: "ENTERPRISE", label: "Enterprise (Unlimited)" },
              ]}
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
            />
            <AdminButton variant="primary" size="md" loading={generating} onClick={handleGenerate}>
              Generate
            </AdminButton>
          </div>
          {generatedKey && (
            <div
              style={{
                marginTop: "12px", padding: "12px", background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px",
              }}
            >
              <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#4ade80", fontWeight: 600 }}>
                ✅ Key generated! Copy it now — it won&apos;t be shown again.
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{
                  flex: 1, padding: "8px 12px", background: "#0f1623",
                  borderRadius: "6px", color: "#e2e8f0", fontSize: "12px",
                  fontFamily: "monospace", wordBreak: "break-all",
                }}>
                  {generatedKey}
                </code>
                <AdminButton variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedKey)}>
                  📋 Copy
                </AdminButton>
              </div>
            </div>
          )}
        </AdminCard>
      )}

      {/* Keys Table */}
      <AdminCard title="API Keys" noPadding>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Client", "Plan", "Usage", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 14px", color: "#5a7090", fontWeight: 600,
                    fontSize: "11px", textTransform: "uppercase", borderBottom: "1px solid #1c2a3d",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#5a7090" }}>
                    No API keys yet.
                  </td>
                </tr>
              ) : keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}>
                  <td style={{ padding: "12px 14px", color: "#e2e8f0", fontWeight: 500 }}>{k.clientName}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge color={planColors[k.plan] || "gray"}>{k.plan}</Badge>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                    {k.callsUsed.toLocaleString()} / {k.callsLimit.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge color={k.isActive ? "green" : "red"} dot>
                      {k.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#5a7090", fontSize: "12px" }}>
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {k.isActive && (
                      <AdminButton variant="danger" size="sm" onClick={() => handleRevoke(k.id)}>
                        Revoke
                      </AdminButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Rate Limiting Info */}
      <AdminCard title="Rate Limiting" subtitle="Default limits per plan" style={{ marginTop: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { plan: "Free", limit: "100/day", color: "#5a7090" },
            { plan: "Starter", limit: "10K/month", color: "#3b82f6" },
            { plan: "Pro", limit: "100K/month", color: "#a855f7" },
            { plan: "Enterprise", limit: "Unlimited", color: "#eab308" },
          ].map((p) => (
            <div key={p.plan} style={{ textAlign: "center", padding: "12px" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: p.color }}>{p.limit}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#5a7090" }}>{p.plan}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}
