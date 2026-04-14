"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminSelect } from "@/components/admin/ui/Select"
import { PageLoader } from "@/components/admin/ui/Spinner"

interface BlogListItem {
  id: string
  slug: string
  category: string | null
  status: string
  title: string
  language: string
  translationCount: number
  viewCount: number
  authorName: string
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, "green" | "yellow" | "blue" | "gray" | "red"> = {
  PUBLISHED: "green",
  DRAFT: "gray",
  REVIEW: "yellow",
  SCHEDULED: "blue",
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      if (categoryFilter) params.set("category", categoryFilter)

      const res = await fetch(`/api/admin/blog?${params}`)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {
      console.error("Failed to fetch posts")
    }
    setLoading(false)
  }, [page, search, statusFilter, categoryFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const toggleSelect = (id: string) => {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelected(s)
  }

  const toggleAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(posts.map((p) => p.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} blog post(s)?`)) return

    for (const id of selected) {
      await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
    }
    setSelected(new Set())
    fetchPosts()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: "#5a7090" }}>
            {total} total blog posts
          </p>
        </div>
        <Link href="/admin/blog/new">
          <AdminButton variant="primary" size="md">
            ✍️ New Blog Post
          </AdminButton>
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#0f1623",
              border: "1px solid #1c2a3d",
              borderRadius: "8px",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ width: "150px" }}>
          <AdminSelect
            options={[
              { value: "", label: "All Status" },
              { value: "DRAFT", label: "Draft" },
              { value: "REVIEW", label: "Review" },
              { value: "PUBLISHED", label: "Published" },
              { value: "SCHEDULED", label: "Scheduled" },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
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
            ]}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 16px",
            background: "rgba(59,130,246,0.08)",
            borderRadius: "8px",
            marginBottom: "12px",
            border: "1px solid rgba(59,130,246,0.15)",
          }}
        >
          <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 500 }}>
            {selected.size} selected
          </span>
          <AdminButton variant="danger" size="sm" onClick={handleBulkDelete}>
            Delete Selected
          </AdminButton>
          <AdminButton variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </AdminButton>
        </div>
      )}

      {/* Table */}
      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading blog posts..." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    <input
                      type="checkbox"
                      checked={selected.size === posts.length && posts.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor: "#3b82f6" }}
                    />
                  </th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Languages</th>
                  <th style={thStyle}>Views</th>
                  <th style={thStyle}>Updated</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#5a7090" }}>
                      No blog posts found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.03)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={tdStyle}>
                        <input
                          type="checkbox"
                          checked={selected.has(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          style={{ accentColor: "#3b82f6" }}
                        />
                      </td>
                      <td style={{ ...tdStyle, maxWidth: "250px" }}>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          style={{
                            color: "#e2e8f0",
                            textDecoration: "none",
                            fontWeight: 500,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {post.title}
                        </Link>
                        <span style={{ fontSize: "11px", color: "#5a7090" }}>/{post.slug}</span>
                      </td>
                      <td style={tdStyle}>
                        {post.category ? (
                          <Badge color="blue">{post.category}</Badge>
                        ) : (
                          <span style={{ color: "#5a7090" }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <Badge color={statusColors[post.status] || "gray"} dot>
                          {post.status}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: "#94a3b8" }}>{post.translationCount} lang(s)</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: "#94a3b8" }}>{post.viewCount.toLocaleString()}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: "#5a7090", fontSize: "12px" }}>
                          {formatDate(post.updatedAt)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Link href={`/admin/blog/${post.id}/edit`}>
                            <AdminButton variant="ghost" size="sm">Edit</AdminButton>
                          </Link>
                        </div>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "20px",
          }}
        >
          <AdminButton
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </AdminButton>
          <span style={{ fontSize: "12px", color: "#5a7090" }}>
            Page {page} of {totalPages}
          </span>
          <AdminButton
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </AdminButton>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  color: "#5a7090",
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "1px solid #1c2a3d",
  whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  whiteSpace: "nowrap",
}
