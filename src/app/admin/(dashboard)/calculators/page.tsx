"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminSelect } from "@/components/admin/ui/Select"
import { PageLoader } from "@/components/admin/ui/Spinner"

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

  useEffect(() => {
    fetchCalculators()
  }, [fetchCalculators])

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#5a7090" }}>
          {total} total calculators
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <AdminButton variant="outline" size="sm">
            🤖 AI Generate Descriptions
          </AdminButton>
          <AdminButton variant="outline" size="sm">
            🌍 Auto Meta Tags
          </AdminButton>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search calculators..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{
              width: "100%", padding: "10px 14px", background: "#0f1623",
              border: "1px solid #1c2a3d", borderRadius: "8px", color: "#e2e8f0",
              fontSize: "13px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ width: "150px" }}>
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
        <div style={{ width: "130px" }}>
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

      {/* Table */}
      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading calculators..." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Name", "Category", "Uses", "Languages", "Status", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calculators.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#5a7090" }}>
                      No calculators found. Import from registry to get started.
                    </td>
                  </tr>
                ) : (
                  calculators.map((calc) => (
                    <tr
                      key={calc.id}
                      style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.03)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={{ ...tdStyle, maxWidth: "250px" }}>
                        <Link
                          href={`/admin/calculators/${calc.id}/edit`}
                          style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: 500 }}
                        >
                          {calc.name}
                        </Link>
                        <br />
                        <span style={{ fontSize: "11px", color: "#5a7090" }}>/{calc.slug}</span>
                      </td>
                      <td style={tdStyle}>
                        <Badge color="blue">{calc.category || "—"}</Badge>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#e2e8f0" }}>
                          {calc.totalUses.toLocaleString()}
                        </span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </AdminButton>
          <span style={{ fontSize: "12px", color: "#5a7090" }}>Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </AdminButton>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 14px", color: "#5a7090", fontWeight: 600,
  fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
  borderBottom: "1px solid #1c2a3d", whiteSpace: "nowrap",
}
const tdStyle: React.CSSProperties = { padding: "12px 14px", whiteSpace: "nowrap" }
