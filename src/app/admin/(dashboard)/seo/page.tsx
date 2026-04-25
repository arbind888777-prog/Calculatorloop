"use client"

import { useState, useEffect } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminTable } from "@/components/admin/ui/Table"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminInput } from "@/components/admin/ui/Input"
import { Modal } from "@/components/admin/ui/Modal"
import { Spinner } from "@/components/admin/ui/Spinner"

// ── Toast ─────────────────────────────────────────
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

// ── Confirm Modal ─────────────────────────────────
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
          <AdminButton variant="danger" onClick={onConfirm} loading={loading}>Remove</AdminButton>
        </div>
      </div>
    </div>
  )
}

// Typing interfaces
interface BulkTranslation extends Record<string, unknown> {
  id: string
  metaTitle: string | null
  metaDesc: string | null
  calculator: { slug: string }
}

interface Keyword extends Record<string, unknown> {
  id: string
  keyword: string
  targetUrl: string | null
  volume: number
  currentRank: number | null
  previousRank: number | null
}

export default function SEOPage() {
  const [sitemapStatus, setSitemapStatus] = useState<"idle" | "generating" | "done">("idle")
  const [toast, setToast] = useState<{ message:string; type:"success"|"error" }|null>(null)
  const [deleteKeyword, setDeleteKeyword] = useState<string|null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const showToast = (message:string, type:"success"|"error"="success") => setToast({ message, type })

  // Keyword Tracker State
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loadingKeywords, setLoadingKeywords] = useState(true)
  const [showKeywordModal, setShowKeywordModal] = useState(false)
  const [newKeyword, setNewKeyword] = useState({ keyword: "", targetUrl: "", volume: 0, currentRank: "" })
  const [savingKeyword, setSavingKeyword] = useState(false)

  // Bulk Meta State
  const [bulkData, setBulkData] = useState<BulkTranslation[]>([])
  const [loadingBulk, setLoadingBulk] = useState(true)
  const [savingBulk, setSavingBulk] = useState(false)

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/admin/seo/keywords")
      if (res.ok) {
        const data = await res.json()
        setKeywords(data.keywords || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingKeywords(false)
    }
  }

  const fetchBulkData = async () => {
    try {
      // By default English
      const res = await fetch("/api/admin/seo/bulk-meta?lang=en")
      if (res.ok) {
        const data = await res.json()
        setBulkData(data.translations || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingBulk(false)
    }
  }

  useEffect(() => {
    fetchKeywords()
    fetchBulkData()
  }, [])

  const handleGenerateSitemap = async () => {
    setSitemapStatus("generating")
    try {
      await fetch("/api/admin/seo/generate-sitemap", { method: "POST" })
      setSitemapStatus("done")
      setTimeout(() => setSitemapStatus("idle"), 3000)
    } catch {
      setSitemapStatus("idle")
    }
  }

  const handleAddKeyword = async () => {
    setSavingKeyword(true)
    try {
      const payload = {
        keyword: newKeyword.keyword,
        targetUrl: newKeyword.targetUrl,
        volume: Number(newKeyword.volume),
        currentRank: newKeyword.currentRank ? Number(newKeyword.currentRank) : null
      }
      const res = await fetch("/api/admin/seo/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        fetchKeywords()
        setShowKeywordModal(false)
        setNewKeyword({ keyword: "", targetUrl: "", volume: 0, currentRank: "" })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingKeyword(false)
    }
  }

  const handleDeleteKeyword = async () => {
    if (!deleteKeyword) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/seo/keywords/${deleteKeyword}`, { method: "DELETE" })
      if (res.ok) { fetchKeywords(); showToast("Keyword removed.") }
    } catch (e) {
      console.error(e); showToast("Failed to delete keyword", "error")
    }
    setDeleteLoading(false)
    setDeleteKeyword(null)
  }

  const handleBulkChange = (id: string, field: "metaTitle" | "metaDesc", value: string) => {
    setBulkData(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const handleSaveBulk = async () => {
    setSavingBulk(true)
    try {
      const updates = bulkData.map(t => ({ id: t.id, metaTitle: t.metaTitle, metaDesc: t.metaDesc }))
      const res = await fetch("/api/admin/seo/bulk-meta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      })
      if (res.ok) { showToast("All meta changes saved!"); fetchBulkData() }
      else showToast("Save failed", "error")
    } catch (e) {
      console.error(e); showToast("Save failed", "error")
    } finally {
      setSavingBulk(false)
    }
  }

  const keywordColumns = [
    { key: "keyword", header: "Keyword Focus", render: (k: Keyword) => <strong>{k.keyword}</strong> },
    { key: "targetUrl", header: "Target Slug" },
    { key: "volume", header: "Volume", render: (k: Keyword) => k.volume.toLocaleString() },
    { key: "rank", header: "SERP Rank", render: (k: Keyword) => {
        if (!k.currentRank) return <Badge color="gray">Not Ranked</Badge>
        const change = k.previousRank ? (k.previousRank - k.currentRank) : 0
        const isUp = change > 0
        const isDown = change < 0
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>#{k.currentRank}</span>
            {isUp && <Badge color="green">+{Math.abs(change)}</Badge>}
            {isDown && <Badge color="red">-{Math.abs(change)}</Badge>}
            {change === 0 && <span style={{ color: "#64748b", fontSize: "11px" }}>-</span>}
          </div>
        )
      }
    },
    { key: "actions", header: "", render: (k: Keyword) => (
      <div style={{ textAlign: "right" }}>
        <AdminButton variant="ghost" size="sm" onClick={() => setDeleteKeyword(k.id)}>🗑️ Remove</AdminButton>
      </div>
    )}
  ]

  const bulkColumns = [
    { key: "calculator", header: "App Slug", render: (t: BulkTranslation) => (
      <span style={{ fontFamily: "monospace", color: "#94a3b8", fontSize: "12px" }}>/{t.calculator.slug}</span>
    )},
    { key: "metaTitle", header: "Meta Title", width: "35%", render: (t: BulkTranslation) => (
      <input 
        value={t.metaTitle || ""}
        onChange={(e) => handleBulkChange(t.id, "metaTitle", e.target.value)}
        placeholder="Override meta title..."
        style={{
          width: "100%", padding: "6px 10px", background: "#0f1623",
          border: "1px solid #1c2a3d", borderRadius: "6px", color: "#e2e8f0",
          fontSize: "12px", outline: "none"
        }}
      />
    )},
    { key: "metaDesc", header: "Meta Description", width: "45%", render: (t: BulkTranslation) => (
       <textarea 
        value={t.metaDesc || ""}
        onChange={(e) => handleBulkChange(t.id, "metaDesc", e.target.value)}
        placeholder="Override meta description..."
        rows={2}
        style={{
          width: "100%", padding: "6px 10px", background: "#0f1623",
          border: "1px solid #1c2a3d", borderRadius: "6px", color: "#e2e8f0",
          fontSize: "12px", outline: "none", resize: "vertical"
        }}
       />
    )}
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteKeyword}
        message="Remove this keyword from tracking? This cannot be undone."
        onConfirm={handleDeleteKeyword}
        onCancel={() => setDeleteKeyword(null)}
        loading={deleteLoading}
      />

      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", color: "#e2e8f0" }}>SEO Manager</h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>Site maps, Bulk Meta tracking, and SERP Keyword tracking</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: "12px" }}>
        {[
          { label: "Sitemap", status: "Active", icon: "🗺️", color: "green" as const },
          { label: "hreflang Tags", status: "Configured", icon: "🌍", color: "green" as const },
          { label: "Schema Markup", status: "Partial", icon: "📋", color: "yellow" as const },
          { label: "Robots.txt", status: "Active", icon: "🤖", color: "green" as const },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "#131d2e", borderRadius: "10px", border: "1px solid #1c2a3d",
              padding: "16px", display: "flex", alignItems: "center", gap: "12px",
            }}
          >
            <span style={{ fontSize: "24px" }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{item.label}</p>
              <Badge color={item.color} dot>{item.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        {/* Sitemap Block */}
        <AdminCard title="Sitemap Utility" subtitle="Push changes to Google">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
              Our dynamic routes generate <code>/sitemap.xml</code> mapping automatically based on Published properties in the Database. Re-ping search engines directly or refresh structure.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <a href="/sitemap.xml" target="_blank" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none" }}>
                View current XML ↗
              </a>
              <AdminButton variant="primary" size="sm" onClick={handleGenerateSitemap} loading={sitemapStatus === "generating"}>
                {sitemapStatus === "done" ? "✅ Rebuilt" : "Regenerate Now"}
              </AdminButton>
            </div>
          </div>
        </AdminCard>

        {/* Keyword Block */}
        <AdminCard 
          title="Search Console Keywords" 
          action={
            <AdminButton size="sm" variant="outline" onClick={() => setShowKeywordModal(true)}>
              + Add Keyword
            </AdminButton>
          }
        >
          {loadingKeywords ? (
             <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}><Spinner size={32} /></div>
          ) : (
            <AdminTable 
              columns={keywordColumns} 
              data={keywords} 
              emptyMessage="You are currently not tracking any keywords. Add one to see rankings here." 
            />
          )}
        </AdminCard>
      </div>

      {/* Bulk SEO Table Block */}
      <AdminCard 
        title="App Meta Grid (EN Locales Base)" 
        subtitle="Mass-update translation specific Meta text fields without hopping into edit views."
        action={
          <AdminButton variant="success" loading={savingBulk} onClick={handleSaveBulk}>
            Save All Changes
          </AdminButton>
        }
      >
        {loadingBulk ? (
           <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}><Spinner size={48} /></div>
        ) : (
           <div style={{ maxHeight: "600px", overflowY: "auto", border: "1px solid #1c2a3d", borderRadius: "8px" }}>
             <AdminTable columns={bulkColumns} data={bulkData} emptyMessage="No calculators mapped." />
           </div>
        )}
      </AdminCard>

      <Modal 
        isOpen={showKeywordModal} 
        onClose={() => setShowKeywordModal(false)}
        title="Track New Keyword"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <AdminButton variant="ghost" onClick={() => setShowKeywordModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={handleAddKeyword} loading={savingKeyword} disabled={!newKeyword.keyword}>
              Save Target
            </AdminButton>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
           <AdminInput 
             label="Keyword Query" 
             placeholder="e.g. basic bmi calculator"
             value={newKeyword.keyword}
             onChange={e => setNewKeyword({...newKeyword, keyword: e.target.value})}
           />
           <AdminInput 
             label="Target Local Slug" 
             placeholder="e.g. bmi-calculator"
             value={newKeyword.targetUrl}
             onChange={e => setNewKeyword({...newKeyword, targetUrl: e.target.value})}
           />
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
             <AdminInput 
               type="number"
               label="Est. Volume" 
               placeholder="0"
               value={newKeyword.volume === 0 ? "" : newKeyword.volume.toString()}
               onChange={e => setNewKeyword({...newKeyword, volume: Number(e.target.value)})}
             />
             <AdminInput 
               type="number"
               label="Current Rank (Found)" 
               placeholder="e.g. 1"
               value={newKeyword.currentRank}
               onChange={e => setNewKeyword({...newKeyword, currentRank: e.target.value})}
             />
           </div>
        </div>
      </Modal>

    </div>
  )
}
