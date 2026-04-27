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
  subcategory: string | null
  linkedToolName: string | null
  status: string
  title: string
  language: string
  translationCount: number
  viewCount: number
  authorName: string
  createdAt: string
  updatedAt: string
}

interface BlogSummary {
  total: number
  published: number
  drafts: number
  review: number
  scheduled: number
  uncategorized: number
  topCategories: Array<{ category: string; count: number }>
}

const statusColors: Record<string, "green" | "yellow" | "blue" | "gray" | "red"> = {
  PUBLISHED: "green",
  DRAFT: "gray",
  REVIEW: "yellow",
  SCHEDULED: "blue",
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [summary, setSummary] = useState<BlogSummary>({
    total: 0,
    published: 0,
    drafts: 0,
    review: 0,
    scheduled: 0,
    uncategorized: 0,
    topCategories: [],
  })
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
      setSummary(data.summary || {
        total: 0,
        published: 0,
        drafts: 0,
        review: 0,
        scheduled: 0,
        uncategorized: 0,
        topCategories: [],
      })
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400 m-0">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "Published", value: summary.published, textClass: "text-green-500" },
          { label: "Drafts", value: summary.drafts, textClass: "text-slate-400" },
          { label: "In Review", value: summary.review, textClass: "text-yellow-400" },
          { label: "Scheduled", value: summary.scheduled, textClass: "text-blue-400" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center shadow-sm"
          >
            <div className="text-2xl font-bold text-slate-200">{item.value}</div>
            <div className={`text-xs font-medium mt-1 ${item.textClass}`}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <div>
          <div className="text-xs font-semibold text-blue-400 mb-1">Blog command center</div>
          <div className="text-xs text-slate-400 max-w-xl">
            Manage drafts, publish multilingual posts, link calculators, and track top categories from one place.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {summary.topCategories.map((item) => (
            <Badge key={item.category} color="blue">
              {item.category === "uncategorized" ? "Uncategorized" : item.category}: {item.count}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1 w-full lg:min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full px-4 py-2.5 bg-[#0f1623] border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500 font-inherit"
          />
        </div>
        <div className="w-full md:w-36 shrink-0">
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
            style={{ marginBottom: 0 }}
          />
        </div>
        <div className="w-full md:w-40 shrink-0">
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
              { value: "everyday", label: "Everyday" },
            ]}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            style={{ marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <span className="text-xs text-blue-400 font-medium">
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
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[13px] text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wide text-[11px] font-semibold bg-slate-900/50">
                  <th className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selected.size === posts.length && posts.length > 0}
                      onChange={toggleAll}
                      className="accent-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">Title</th>
                  <th className="px-4 py-3 whitespace-nowrap">Category / Subcategory</th>
                  <th className="px-4 py-3 whitespace-nowrap">Linked Tool</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Languages</th>
                  <th className="px-4 py-3 whitespace-nowrap">Views</th>
                  <th className="px-4 py-3 whitespace-nowrap">Updated</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No blog posts found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-blue-500/5 transition-colors group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selected.has(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="accent-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[200px] sm:max-w-[250px] overflow-hidden">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-slate-200 font-medium block truncate hover:text-blue-400 transition-colors"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate block">/{post.slug}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {post.category ? (
                            <Badge color="blue">{post.category}</Badge>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                          {post.subcategory ? (
                            <span className="text-[11px] text-slate-400">↳ {post.subcategory}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {post.linkedToolName ? (
                          <Badge color="purple" dot>{post.linkedToolName}</Badge>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge color={statusColors[post.status] || "gray"} dot>
                          {post.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{post.translationCount} lang(s)</span>
                          <Badge color="purple">{post.language.toUpperCase()}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-400 font-medium">{post.viewCount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-400 text-xs">
                          {formatDate(post.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/admin/blog/${post.id}/edit`}>
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
        <div className="flex items-center justify-center gap-3 mt-6">
          <AdminButton
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </AdminButton>
          <span className="text-xs text-slate-400 font-medium">
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
