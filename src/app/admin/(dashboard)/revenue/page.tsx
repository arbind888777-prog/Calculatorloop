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
  { id: "adsense",  label: "Google AdSense", icon: "📢", color: "#22c55e" },
  { id: "api",      label: "API Revenue",    icon: "🔌", color: "#3b82f6" },
  { id: "premium",  label: "Premium Plans",  icon: "⭐", color: "#eab308" },
  { id: "affiliate",label: "Affiliate",      icon: "🤝", color: "#a855f7" },
  { id: "other",    label: "Other",          icon: "💰", color: "#94a3b8" },
]

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ── Toast ────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success"|"error"; onClose: ()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position:"fixed", bottom:"24px", right:"24px", zIndex:9999,
      padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:500,
      boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
      background: type==="success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border:`1px solid ${type==="success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
      color: type==="success" ? "#10b981" : "#f87171",
      display:"flex", alignItems:"center", gap:"8px",
    }}>
      {type==="success" ? "✅" : "❌"} {message}
    </div>
  )
}

// ── Confirm Modal ────────────────────────────────
function ConfirmModal({ isOpen, message, onConfirm, onCancel, loading }: {
  isOpen:boolean; message:string; onConfirm:()=>void; onCancel:()=>void; loading:boolean
}) {
  if (!isOpen) return null
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ background:"#131d2e", border:"1px solid #1c2a3d", borderRadius:"14px", padding:"28px", maxWidth:"380px", width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize:"32px", textAlign:"center", marginBottom:"16px" }}>⚠️</div>
        <p style={{ margin:"0 0 24px 0", fontSize:"14px", color:"#cbd5e1", textAlign:"center", lineHeight:1.6 }}>{message}</p>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center" }}>
          <AdminButton variant="outline" onClick={onCancel}>Cancel</AdminButton>
          <AdminButton variant="danger" onClick={onConfirm} loading={loading}>Delete</AdminButton>
        </div>
      </div>
    </div>
  )
}

export default function RevenuePage() {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [toast, setToast] = useState<{ message:string; type:"success"|"error" }|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RevenueItem|null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create"|"edit">("create")
  const [editingId, setEditingId] = useState("")
  const [formData, setFormData] = useState({ source:"adsense", amount:"0", currency:"USD", month:new Date().getMonth()+1, year:new Date().getFullYear(), notes:"" })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const showToast = (message:string, type:"success"|"error"="success") => setToast({ message, type })

  const fetchRevenue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/revenue?year=${yearFilter}`)
      const data = await res.json()
      setRevenueItems(data.revenue || [])
    } catch { console.error("Failed to fetch revenue") }
    setLoading(false)
  }, [yearFilter])

  useEffect(() => { fetchRevenue() }, [fetchRevenue])

  // ── Calculations ──────────────────────────────
  const totalsBySource = SOURCES.reduce((acc, s) => {
    acc[s.id] = revenueItems.filter(r => r.source === s.id).reduce((sum, r) => sum + r.amount, 0)
    return acc
  }, {} as Record<string, number>)

  const totalAmount = revenueItems.reduce((sum, r) => sum + r.amount, 0)

  // Monthly totals for bar chart
  const monthlyTotals = Array.from({ length: 12 }, (_, i) =>
    revenueItems.filter(r => r.month === i + 1).reduce((sum, r) => sum + r.amount, 0)
  )
  const maxMonthly = Math.max(...monthlyTotals, 1)

  // ── Modal helpers ─────────────────────────────
  const openCreateModal = () => {
    setModalMode("create")
    setFormData({ source:"adsense", amount:"0", currency:"USD", month:new Date().getMonth()+1, year:yearFilter, notes:"" })
    setFormError("")
    setIsModalOpen(true)
  }

  const openEditModal = (item: RevenueItem) => {
    setModalMode("edit")
    setEditingId(item.id)
    setFormData({ source:item.source, amount:item.amount.toString(), currency:item.currency, month:item.month, year:item.year, notes:item.notes||"" })
    setFormError("")
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!formData.amount || isNaN(Number(formData.amount))) { setFormError("Valid amount is required"); return }
    setFormLoading(true)
    try {
      const url = modalMode==="create" ? "/api/admin/revenue" : `/api/admin/revenue/${editingId}`
      const res = await fetch(url, {
        method: modalMode==="create" ? "POST" : "PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save") }
      setIsModalOpen(false)
      fetchRevenue()
      showToast(modalMode==="create" ? "Revenue entry added!" : "Entry updated!")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setFormError(msg)
    }
    setFormLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/revenue/${deleteTarget.id}`, { method:"DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      fetchRevenue()
      showToast("Entry deleted.")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      showToast(msg, "error")
    }
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(amount)

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteTarget}
        message={`Delete revenue entry for ${deleteTarget ? SOURCES.find(s=>s.id===deleteTarget.source)?.label : ""} (Month ${deleteTarget?.month})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
          <AdminSelect
            options={[
              { value:String(new Date().getFullYear()), label:String(new Date().getFullYear()) },
              { value:String(new Date().getFullYear()-1), label:String(new Date().getFullYear()-1) },
            ]}
            value={String(yearFilter)}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
          />
          <div style={{
            background:"linear-gradient(135deg,#22c55e,#16a34a)",
            borderRadius:"10px", padding:"8px 16px",
            fontSize:"14px", fontWeight:800, color:"#fff",
            boxShadow:"0 4px 16px rgba(34,197,94,0.3)"
          }}>
            {yearFilter} Total: {fmt(totalAmount)}
          </div>
        </div>
        <AdminButton variant="primary" size="sm" onClick={openCreateModal}>+ Add Entry</AdminButton>
      </div>

      {/* Source Cards - responsive grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:"12px" }}>
        {SOURCES.map(source => (
          <div key={source.id} style={{
            background:"#131d2e", borderRadius:"12px", border:"1px solid #1c2a3d",
            padding:"16px", position:"relative", overflow:"hidden"
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:source.color, borderRadius:"12px 12px 0 0" }} />
            <div style={{ fontSize:"20px", marginBottom:"8px" }}>{source.icon}</div>
            <div style={{ fontSize:"11px", color:"#64748b", marginBottom:"4px" }}>{source.label}</div>
            <div style={{ fontSize:"20px", fontWeight:800, color:source.color }}>
              {fmt(totalsBySource[source.id] || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Bar Chart */}
      <AdminCard title={`Monthly Revenue — ${yearFilter}`}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"80px", marginTop:"8px" }}>
          {monthlyTotals.map((val, i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
              <div style={{
                width:"100%", borderRadius:"4px 4px 0 0",
                background: val > 0 ? "linear-gradient(180deg,#3b82f6,#1d4ed8)" : "#1c2a3d",
                height:`${Math.max((val / maxMonthly) * 64, val > 0 ? 8 : 0)}px`,
                minHeight: val > 0 ? "8px" : "0",
                transition:"height 0.4s ease",
                cursor:"default", position:"relative"
              }}
                title={`${MONTHS[i]}: ${fmt(val)}`}
              />
              <span style={{ fontSize:"9px", color:"#475569", whiteSpace:"nowrap" }}>{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Table */}
      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading revenue data..." />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr>
                  {["Month","Source","Amount","Notes","Actions"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revenueItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign:"center", padding:"48px", color:"#5a7090" }}>
                      <div style={{ fontSize:"32px", marginBottom:"12px" }}>💰</div>
                      No revenue entries for {yearFilter}.
                    </td>
                  </tr>
                ) : (
                  revenueItems.map(item => {
                    const src = SOURCES.find(s => s.id === item.source) || SOURCES[SOURCES.length-1]
                    return (
                      <tr key={item.id}
                        style={{ borderBottom:"1px solid rgba(28,42,61,0.4)", transition:"background 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.04)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontWeight:600, color:"#e2e8f0" }}>
                            {MONTHS[item.month-1]} {item.year}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <span>{src.icon}</span>
                            <span style={{ color:"#94a3b8" }}>{src.label}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight:700, color:src.color }}>{fmt(item.amount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color:"#64748b", fontSize:"12px" }}>{item.notes || "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display:"flex", gap:"6px" }}>
                            <AdminButton variant="ghost" size="sm" onClick={() => openEditModal(item)}>Edit</AdminButton>
                            <AdminButton variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>Delete</AdminButton>
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
        title={modalMode==="create" ? "Add Revenue Entry" : "Edit Entry"}
      >
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {formError && (
            <div style={{ padding:"10px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"6px", color:"#f87171", fontSize:"12px" }}>
              {formError}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <AdminSelect
              label="Source"
              options={SOURCES.map(s => ({ value:s.id, label:s.label }))}
              value={formData.source}
              onChange={e => setFormData({...formData, source:e.target.value})}
            />
            <AdminInput
              label="Amount (USD)"
              type="number"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount:e.target.value})}
            />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <AdminSelect
              label="Month"
              options={MONTHS.map((m,i) => ({ value:String(i+1), label:m }))}
              value={String(formData.month)}
              onChange={e => setFormData({...formData, month:parseInt(e.target.value)})}
            />
            <AdminInput
              label="Year"
              type="number"
              value={String(formData.year)}
              onChange={e => setFormData({...formData, year:parseInt(e.target.value)})}
            />
          </div>
          <AdminInput
            label="Notes (Optional)"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes:e.target.value})}
          />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"8px" }}>
            <AdminButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={handleSave} loading={formLoading}>
              {modalMode==="create" ? "Add Entry" : "Save Changes"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign:"left", padding:"10px 14px", color:"#5a7090",
  fontWeight:600, fontSize:"11px", textTransform:"uppercase",
  letterSpacing:"0.5px", borderBottom:"1px solid #1c2a3d", whiteSpace:"nowrap"
}
const tdStyle: React.CSSProperties = { padding:"12px 14px" }
