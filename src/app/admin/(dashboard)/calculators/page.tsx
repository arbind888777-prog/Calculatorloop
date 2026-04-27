"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminSelect } from "@/components/admin/ui/Select"
import { PageLoader } from "@/components/admin/ui/Spinner"
import { toast } from "sonner"

interface CalcItem {
  id: string
  slug: string
  name: string
  category: string
  totalUses: number
  isActive: boolean
  languageCount: number
}

export default function CalculatorsPage() {
  const [calculators, setCalculators] = useState<CalcItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const fetchCalculators = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (categoryFilter) params.set("category", categoryFilter)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/admin/calculators?${params}`)
      const data = await res.json()
      setCalculators(data.calculators || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {
      console.error("Failed to fetch calculators")
    }
    setLoading(false)
  }, [page, search, categoryFilter, statusFilter])

  useEffect(() => { fetchCalculators() }, [fetchCalculators])

  const handleSyncRegex = async () => {
    if (confirm("Are you sure you want to import calculators from toolsData.ts? This will add any missing calculators.")) {
      setSyncing(true)
      try {
        const res = await fetch("/api/admin/calculators/sync", { method: "POST" })
        const data = await res.json()
        if (data.success) {
          toast.success(`Synced ${data.count} calculators successfully.`)
          fetchCalculators()
        } else {
          toast.error(data.error || "Failed to sync calculators")
        }
      } catch {
        toast.error("An error occurred while syncing.")
      }
      setSyncing(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#5a7090" }}>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#e2e8f0" }}>{total}</span>
          {" "}calculators total
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <AdminButton variant="outline" size="sm" onClick={handleSyncRegex} disabled={syncing}>
            {syncing ? "⏳ Syncing..." : "📥 Import from Registry"}
          </AdminButton>
          <AdminButton variant="outline" size="sm">🤖 AI Descriptions</AdminButton>
          <AdminButton variant="outline" size="sm">🌍 Auto Meta Tags</AdminButton>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5a7090", fontSize: "13px", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              placeholder="Search calculators..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                background: "#0f1623",
                border: "1px solid #1c2a3d",
                borderRadius: "10px",
                color: "#e2e8f0",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#1c2a3d")}
            />
          </div>
        </div>
        <div style={{ minWidth: "150px" }}>
          <AdminSelect
            options={[
              { value: "", label: "All Categories" },
              { value: "financial", label: "Financial" },
              { value: "health", label: "Health" },
              { value: "math", label: "Math" },
              { value: "science", label: "Science" },
              { value: "technology", label: "Technology" },
              { value: "education", label: "Education" },
              { value: "business", label: "Business" },
              { value: "construction", label: "Construction" },
            ]}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          />
        </div>
        <div style={{ minWidth: "130px" }}>
          <AdminSelect
            options={[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table / Mobile Cards */}
      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading calculators..." />
        ) : calculators.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧮</div>
            <p style={{ color: "#7a8ba4", fontWeight: 600, marginBottom: "6px" }}>No calculators found</p>
            <p style={{ color: "#5a7090", fontSize: "12px" }}>Click &quot;Import from Registry&quot; to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="admin-calc-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Name", "Category", "Uses", "Languages", "Status", "Actions"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calculators.map((calc) => (
                    <tr
                      key={calc.id}
                      style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.04)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={{ ...tdStyle, maxWidth: "250px" }}>
                        <Link href={`/admin/calculators/${calc.id}/edit`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: 500 }}>
                          {calc.name}
                        </Link>
                        <br />
                        <span style={{ fontSize: "11px", color: "#5a7090" }}>/{calc.slug}</span>
                      </td>
                      <td style={tdStyle}>
                        <Badge color="blue">{calc.category || "—"}</Badge>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{calc.totalUses.toLocaleString()}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: "#94a3b8" }}>{calc.languageCount} lang(s)</span>
                      </td>
                      <td style={tdStyle}>
                        <Badge color={calc.isActive ? "green" : "red"} dot>
                          {calc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        <Link href={`/admin/calculators/${calc.id}/edit`}>
                          <AdminButton variant="ghost" size="sm">Edit</AdminButton>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="admin-calc-cards" style={{ display: "none", flexDirection: "column", gap: "8px", padding: "12px" }}>
              {calculators.map((calc) => (
                <div
                  key={calc.id}
                  style={{
                    background: "#0f1623",
                    borderRadius: "12px",
                    border: "1px solid #1c2a3d",
                    padding: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link href={`/admin/calculators/${calc.id}/edit`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: 600, fontSize: "13px" }}>
                        {calc.name}
                      </Link>
                      <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#5a7090" }}>/{calc.slug}</p>
                    </div>
                    <Badge color={calc.isActive ? "green" : "red"} dot>
                      {calc.isActive ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <Badge color="blue">{calc.category || "—"}</Badge>
                    <span style={{ fontSize: "11px", color: "#7a8ba4" }}>📊 {calc.totalUses.toLocaleString()} uses</span>
                    <span style={{ fontSize: "11px", color: "#7a8ba4" }}>🌍 {calc.languageCount} lang(s)</span>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <Link href={`/admin/calculators/${calc.id}/edit`}>
                      <AdminButton variant="ghost" size="sm">✏️ Edit</AdminButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </AdminButton>
          <span style={{ fontSize: "12px", color: "#7a8ba4", padding: "0 4px" }}>
            Page <strong style={{ color: "#e2e8f0" }}>{page}</strong> of {totalPages}
          </span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </AdminButton>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .admin-calc-table { display: none !important; }
          .admin-calc-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 16px", color: "#5a7090", fontWeight: 600,
  fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
  borderBottom: "1px solid #1c2a3d", whiteSpace: "nowrap", background: "#0f1623",
}
const tdStyle: React.CSSProperties = { padding: "13px 16px", whiteSpace: "nowrap" }
