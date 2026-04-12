"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"
import { Modal as AdminModal } from "@/components/admin/ui/Modal"
import { PageLoader } from "@/components/admin/ui/Spinner"

interface RevenueItem {
  id: string
  source: string
  amount: number
  currency: string
  month: number
  year: number
  notes: string | null
  createdAt: string
}

const SOURCES = [
  { id: "adsense", label: "Google AdSense", icon: "📢", color: "#22c55e" },
  { id: "api", label: "API Revenue", icon: "🔌", color: "#3b82f6" },
  { id: "premium", label: "Premium Plans", icon: "⭐", color: "#eab308" },
  { id: "affiliate", label: "Affiliate", icon: "🤝", color: "#a855f7" },
  { id: "other", label: "Other", icon: "💰", color: "#94a3b8" },
]

export default function RevenuePage() {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({
    source: "adsense",
    amount: "0",
    currency: "USD",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: ""
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchRevenue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/revenue?year=${yearFilter}`)
      const data = await res.json()
      setRevenueItems(data.revenue || [])
    } catch {
      console.error("Failed to fetch revenue")
    }
    setLoading(false)
  }, [yearFilter])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  // Calculate totals
  const totalsBySource = SOURCES.reduce((acc, source) => {
    acc[source.id] = revenueItems
      .filter(r => r.source === source.id)
      .reduce((sum, r) => sum + r.amount, 0)
    return acc
  }, {} as Record<string, number>)

  const totalAmount = revenueItems.reduce((sum, r) => sum + r.amount, 0)

  const openCreateModal = () => {
    setModalMode("create")
    setFormData({
      source: "adsense", amount: "0", currency: "USD",
      month: new Date().getMonth() + 1, year: yearFilter, notes: ""
    })
    setFormError("")
    setIsModalOpen(true)
  }

  const openEditModal = (item: RevenueItem) => {
    setModalMode("edit")
    setEditingId(item.id)
    setFormData({
      source: item.source, amount: item.amount.toString(), currency: item.currency,
      month: item.month, year: item.year, notes: item.notes || ""
    })
    setFormError("")
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!formData.amount || isNaN(Number(formData.amount))) {
      setFormError("Valid amount is required")
      return
    }

    setFormLoading(true)
    try {
      const url = modalMode === "create" ? "/api/admin/revenue" : `/api/admin/revenue/${editingId}`
      const method = modalMode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save revenue")
      }

      setIsModalOpen(false)
      fetchRevenue()
    } catch (err: any) {
      setFormError(err.message)
    }
    setFormLoading(false)
  }

  const handleDelete = async (id: string, month: number, source: string) => {
    if (!window.confirm(`Delete revenue record for ${source} (Month ${month})?`)) return
    
    try {
      const res = await fetch(`/api/admin/revenue/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      fetchRevenue()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <AdminSelect
            options={[
              { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
              { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
            ]}
            value={String(yearFilter)}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
          />
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>
            Total {yearFilter}: {formatCurrency(totalAmount)}
          </span>
        </div>
        <AdminButton variant="primary" size="sm" onClick={openCreateModal}>
          + Add Entry
        </AdminButton>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {SOURCES.slice(0, 4).map((source) => (
          <div key={source.id} style={{
            background: "#131d2e", borderRadius: "10px",
            border: "1px solid #1c2a3d", padding: "20px",
          }}>
            <span style={{ fontSize: "24px" }}>{source.icon}</span>
            <p style={{ margin: "8px 0 2px 0", fontSize: "11px", color: "#5a7090" }}>{source.label}</p>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: source.color }}>
              {formatCurrency(totalsBySource[source.id] || 0)}
            </p>
          </div>
        ))}
      </div>

      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading revenue data..." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Month", "Source", "Amount", "Notes", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revenueItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#5a7090" }}>
                      No revenue entries for {yearFilter}.
                    </td>
                  </tr>
                ) : (
                  revenueItems.map((item) => {
                    const sourceInfo = SOURCES.find(s => s.id === item.source) || SOURCES[SOURCES.length - 1]
                    return (
                      <tr
                        key={item.id}
                        style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.03)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' })}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{sourceInfo.icon}</span>
                            <span>{sourceInfo.label}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: sourceInfo.color }}>{formatCurrency(item.amount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: "#94a3b8" }}>{item.notes || "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <AdminButton variant="ghost" size="sm" onClick={() => openEditModal(item)}>Edit</AdminButton>
                            <AdminButton variant="danger" size="sm" onClick={() => handleDelete(item.id, item.month, item.source)}>Delete</AdminButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Add Revenue Entry" : "Edit Entry"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formError && (
            <div style={{ padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#f87171", fontSize: "12px" }}>
              {formError}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <AdminSelect
              label="Source"
              options={SOURCES.map(s => ({ value: s.id, label: s.label }))}
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
            <AdminInput
              label="Amount (USD)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <AdminSelect
              label="Month"
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString('default', { month: 'long' }) }))}
              value={String(formData.month)}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
            />
            <AdminInput
              label="Year"
              type="number"
              value={String(formData.year)}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            />
          </div>

          <AdminInput
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <AdminButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={handleSave} loading={formLoading}>
              {modalMode === "create" ? "Add Entry" : "Save Changes"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 14px", color: "#5a7090", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1c2a3d", whiteSpace: "nowrap" }
const tdStyle: React.CSSProperties = { padding: "12px 14px", whiteSpace: "nowrap" }
