"use client"

import { useState, useEffect } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { Spinner } from "@/components/admin/ui/Spinner"
import { Mail, Trash2, Power, PowerOff, Download } from "lucide-react"

interface Subscriber {
  id: string
  email: string
  name: string | null
  subscribedAt: string
  active: boolean
}

// ── Toast ────────────────────────────────────────
function Toast({ message, type, onClose }: { message:string; type:"success"|"error"; onClose:()=>void }) {
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

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all"|"active"|"inactive">("all")
  const [toast, setToast] = useState<{ message:string; type:"success"|"error" }|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subscriber|null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const showToast = (message:string, type:"success"|"error"="success") => setToast({ message, type })

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/subscribers")
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSubscribers() }, [])

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ active: !currentState })
      })
      if (res.ok) {
        fetchSubscribers()
        showToast(currentState ? "Subscriber deactivated." : "Subscriber activated!")
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/subscribers/${deleteTarget.id}`, { method:"DELETE" })
      if (res.ok) {
        fetchSubscribers()
        showToast("Subscriber permanently deleted.")
      }
    } catch (err) { console.error(err); showToast("Delete failed", "error") }
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  // Export as CSV
  const handleExportCSV = () => {
    const rows = [["Email","Name","Subscribed On","Status"]]
    subscribers.forEach(s => rows.push([s.email, s.name||"", new Date(s.subscribedAt).toLocaleDateString(), s.active?"Active":"Unsubscribed"]))
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type:"text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download="subscribers.csv"; a.click()
    URL.revokeObjectURL(url)
    showToast("CSV exported!")
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })

  // Filtered list
  const filtered = subscribers.filter(s => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name?.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter==="all" || (filter==="active" ? s.active : !s.active)
    return matchSearch && matchFilter
  })

  const totalActive = subscribers.filter(s => s.active).length
  const totalInactive = subscribers.length - totalActive
  const growthRate = subscribers.length > 0 ? Math.round((totalActive / subscribers.length) * 100) : 0

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteTarget}
        message={`Permanently delete "${deleteTarget?.email}"? They will no longer receive any emails.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"12px" }}>
        {[
          { label:"Total Subscribers", value:subscribers.length, icon:"👥", color:"#3b82f6" },
          { label:"Active",            value:totalActive,        icon:"✅", color:"#22c55e" },
          { label:"Unsubscribed",      value:totalInactive,      icon:"❌", color:"#94a3b8" },
          { label:"Retention Rate",    value:`${growthRate}%`,   icon:"📈", color:"#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{
            background:"#131d2e", border:"1px solid #1c2a3d", borderRadius:"12px",
            padding:"16px", position:"relative", overflow:"hidden"
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:s.color, borderRadius:"12px 12px 0 0" }} />
            <div style={{ fontSize:"18px", marginBottom:"8px" }}>{s.icon}</div>
            <div style={{ fontSize:"22px", fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:"#64748b", marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap" }}>
        <input
          type="text"
          placeholder="🔍  Search subscribers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex:1, minWidth:"180px", padding:"9px 14px",
            background:"#0f1623", border:"1px solid #1c2a3d",
            borderRadius:"8px", color:"#e2e8f0", fontSize:"13px",
            outline:"none", fontFamily:"inherit"
          }}
        />
        {/* Filter pills */}
        <div style={{ display:"flex", background:"#0f1623", border:"1px solid #1c2a3d", borderRadius:"8px", padding:"2px" }}>
          {(["all","active","inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"6px 14px", borderRadius:"6px", border:"none", cursor:"pointer",
              fontSize:"11px", fontWeight:600, textTransform:"capitalize",
              background: filter===f ? "#3b82f6" : "transparent",
              color: filter===f ? "#fff" : "#64748b",
              transition:"all 0.2s"
            }}>{f}</button>
          ))}
        </div>
        <AdminButton variant="outline" size="sm" onClick={handleExportCSV}>
          <Download size={14} style={{ marginRight:"4px" }} />
          Export CSV
        </AdminButton>
      </div>

      {/* Table Card */}
      <AdminCard noPadding>
        {loading ? (
          <div style={{ padding:"48px", display:"flex", justifyContent:"center" }}>
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px", color:"#5a7090" }}>
            <div style={{ fontSize:"32px", marginBottom:"12px" }}>📭</div>
            {search ? "No subscribers match your search." : "No one has subscribed yet."}
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr>
                  {["Email","Name","Subscribed On","Status","Actions"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom:"1px solid rgba(28,42,61,0.4)", transition:"background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.04)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <Mail size={14} color="#64748b" />
                        <span style={{ color:"#e2e8f0", fontWeight:500 }}>{s.email}</span>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ color:"#94a3b8" }}>{s.name || "—"}</span></td>
                    <td style={tdStyle}><span style={{ color:"#64748b", fontSize:"12px" }}>{formatDate(s.subscribedAt)}</span></td>
                    <td style={tdStyle}>
                      {s.active ? (
                        <Badge color="green" dot>Active</Badge>
                      ) : (
                        <Badge color="gray" dot>Unsubscribed</Badge>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <button
                          onClick={() => handleToggleActive(s.id, s.active)}
                          title={s.active ? "Deactivate" : "Activate"}
                          style={{
                            width:"30px", height:"30px", borderRadius:"8px", border:"none",
                            background:"rgba(59,130,246,0.1)", cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"background 0.2s"
                          }}
                        >
                          {s.active
                            ? <PowerOff size={13} color="#94a3b8" />
                            : <Power size={13} color="#10b981" />
                          }
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          title="Delete subscriber"
                          style={{
                            width:"30px", height:"30px", borderRadius:"8px", border:"none",
                            background:"rgba(239,68,68,0.08)", cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"background 0.2s"
                          }}
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Footer count */}
      {!loading && (
        <div style={{ textAlign:"right", fontSize:"12px", color:"#334155" }}>
          Showing {filtered.length} of {subscribers.length} subscribers
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign:"left", padding:"10px 14px", color:"#5a7090",
  fontWeight:600, fontSize:"11px", textTransform:"uppercase",
  letterSpacing:"0.5px", borderBottom:"1px solid #1c2a3d", whiteSpace:"nowrap"
}
const tdStyle: React.CSSProperties = { padding:"12px 14px" }
