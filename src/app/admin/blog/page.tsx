"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
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

interface CoverageToolInsight {
  toolId: string
  title: string
  categoryId: string
  categoryName: string
  subcategoryKey: string
  subcategoryName: string
  liveGuides: number
  draftGuides: number
  totalGuides: number
  missingBuckets: string[]
}

interface CategoryCoverageInsight {
  categoryId: string
  categoryName: string
  totalCalculators: number
  coveredCalculators: number
  liveGuides: number
  draftGuides: number
  coveragePercent: number
}

interface BlogInsights {
  summary: {
    totalCalculators: number
    calculatorsWithAnyGuides: number
    calculatorsWithLiveGuides: number
    calculatorsWithDraftGuides: number
    calculatorsWithoutGuides: number
    averageLiveGuidesPerCoveredCalculator: number
    unlinkedPostCount: number
    linkedPublishedPosts: number
    linkedDraftPosts: number
  }
  zeroCoverage: CoverageToolInsight[]
  thinCoverage: CoverageToolInsight[]
  readyToPublish: CoverageToolInsight[]
  categoryCoverage: CategoryCoverageInsight[]
}

const statusColors: Record<string, "green" | "yellow" | "blue" | "gray" | "red"> = {
  PUBLISHED: "green",
  DRAFT: "gray",
  REVIEW: "yellow",
  SCHEDULED: "blue",
}

export default function BlogListPage() {
  const { data: session } = useSession()
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
  const [insights, setInsights] = useState<BlogInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const role = (session?.user as { role?: string } | undefined)?.role
  const canEdit = role === "SUPER_ADMIN" || role === "EDITOR"

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

  useEffect(() => {
    let cancelled = false

    const fetchInsights = async () => {
      setInsightsLoading(true)
      try {
        const res = await fetch("/api/admin/blog/insights")
        const data = await res.json()
        if (!cancelled) {
          setInsights(data)
        }
      } catch {
        console.error("Failed to fetch blog insights")
      } finally {
        if (!cancelled) {
          setInsightsLoading(false)
        }
      }
    }

    fetchInsights()
    return () => {
      cancelled = true
    }
  }, [])

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
    if (!canEdit) return
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

  const buildNewGuideHref = (tool: CoverageToolInsight) =>
    `/admin/blog/new?calculator=${encodeURIComponent(tool.toolId)}&category=${encodeURIComponent(tool.categoryId)}&subcategory=${encodeURIComponent(tool.subcategoryKey)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400 m-0">
            {total} total blog posts
          </p>
        </div>
        {canEdit ? (
          <Link href="/admin/blog/new">
            <AdminButton variant="primary" size="md">
              New Blog Post
            </AdminButton>
          </Link>
        ) : (
          <Badge color="gray">Read-only access</Badge>
        )}
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

      <AdminCard
        title="Coverage insights"
        subtitle="See which calculators are already supported by guides, which ones still need content, and where a draft can become a live help article."
      >
        {insightsLoading ? (
          <PageLoader message="Loading coverage insights..." />
        ) : !insights ? (
          <div className="text-sm text-slate-400">Insights are temporarily unavailable.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-2xl font-bold text-slate-100">{insights.summary.calculatorsWithLiveGuides}</div>
                <div className="mt-1 text-xs font-medium text-green-400">Calculators with live guides</div>
                <div className="mt-2 text-xs text-slate-500">
                  {insights.summary.totalCalculators} total calculators
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-2xl font-bold text-slate-100">{insights.summary.calculatorsWithoutGuides}</div>
                <div className="mt-1 text-xs font-medium text-red-400">Calculators with zero guides</div>
                <div className="mt-2 text-xs text-slate-500">
                  Best place to start new content clusters
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-2xl font-bold text-slate-100">{insights.summary.linkedDraftPosts}</div>
                <div className="mt-1 text-xs font-medium text-yellow-400">Linked drafts in pipeline</div>
                <div className="mt-2 text-xs text-slate-500">
                  Publish-ready ideas already in progress
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-2xl font-bold text-slate-100">{insights.summary.averageLiveGuidesPerCoveredCalculator}</div>
                <div className="mt-1 text-xs font-medium text-blue-400">Average live guides per covered tool</div>
                <div className="mt-2 text-xs text-slate-500">
                  Deeper clusters usually build more trust
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge color="blue">Linked published: {insights.summary.linkedPublishedPosts}</Badge>
              <Badge color="yellow">Linked drafts: {insights.summary.linkedDraftPosts}</Badge>
              <Badge color="gray">Unlinked posts: {insights.summary.unlinkedPostCount}</Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-sm font-semibold text-slate-100">Zero coverage</div>
                <div className="mt-1 text-xs text-slate-400">
                  These calculators do not have any guide yet.
                </div>
                <div className="mt-4 space-y-3">
                  {insights.zeroCoverage.length === 0 ? (
                    <div className="text-xs text-slate-500">Nice. No empty calculators in the top list.</div>
                  ) : (
                    insights.zeroCoverage.map((tool) => (
                      <div key={tool.toolId} className="rounded-lg border border-slate-800 p-3">
                        <div className="text-sm font-medium text-slate-100">{tool.title}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {tool.categoryName} / {tool.subcategoryName}
                        </div>
                        <div className="mt-3">
                          <Link href={buildNewGuideHref(tool)}>
                            <AdminButton variant="outline" size="sm">Write first guide</AdminButton>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-sm font-semibold text-slate-100">Thin coverage</div>
                <div className="mt-1 text-xs text-slate-400">
                  These tools have some content, but important guide types are still missing.
                </div>
                <div className="mt-4 space-y-3">
                  {insights.thinCoverage.length === 0 ? (
                    <div className="text-xs text-slate-500">No thin-coverage tools in the current shortlist.</div>
                  ) : (
                    insights.thinCoverage.map((tool) => (
                      <div key={tool.toolId} className="rounded-lg border border-slate-800 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-100">{tool.title}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {tool.liveGuides} live guide{tool.liveGuides === 1 ? "" : "s"}
                            </div>
                          </div>
                          <Badge color="blue">{tool.categoryName}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tool.missingBuckets.slice(0, 4).map((bucket) => (
                            <Badge key={bucket} color="yellow">{bucket}</Badge>
                          ))}
                        </div>
                        <div className="mt-3">
                          <Link href={buildNewGuideHref(tool)}>
                            <AdminButton variant="outline" size="sm">Add missing guide</AdminButton>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-sm font-semibold text-slate-100">Drafts ready to turn live</div>
                <div className="mt-1 text-xs text-slate-400">
                  These tools already have linked drafts but no live guide yet.
                </div>
                <div className="mt-4 space-y-3">
                  {insights.readyToPublish.length === 0 ? (
                    <div className="text-xs text-slate-500">No publish-ready gaps right now.</div>
                  ) : (
                    insights.readyToPublish.map((tool) => (
                      <div key={tool.toolId} className="rounded-lg border border-slate-800 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-100">{tool.title}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {tool.draftGuides} draft guide{tool.draftGuides === 1 ? "" : "s"} linked
                            </div>
                          </div>
                          <Badge color="purple">{tool.subcategoryName}</Badge>
                        </div>
                        <div className="mt-3">
                          <Link href={`/admin/blog?search=${encodeURIComponent(tool.title)}`}>
                            <AdminButton variant="outline" size="sm">Review drafts</AdminButton>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Category coverage</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Track which calculator categories already have enough live guide support.
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {insights.categoryCoverage.slice(0, 9).map((item) => (
                  <div key={item.categoryId} className="rounded-lg border border-slate-800 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-100">{item.categoryName}</div>
                      <Badge color="blue">{item.coveragePercent}% covered</Badge>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${item.coveragePercent}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>{item.coveredCalculators}/{item.totalCalculators} calculators covered</span>
                      <span>|</span>
                      <span>{item.liveGuides} live guides</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminCard>

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
      {canEdit && selected.size > 0 && (
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
                  {canEdit && (
                    <th className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selected.size === posts.length && posts.length > 0}
                        onChange={toggleAll}
                        className="accent-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 whitespace-nowrap">Title</th>
                  <th className="px-4 py-3 whitespace-nowrap">Category / Subcategory</th>
                  <th className="px-4 py-3 whitespace-nowrap">Linked Tool</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Languages</th>
                  <th className="px-4 py-3 whitespace-nowrap">Views</th>
                  <th className="px-4 py-3 whitespace-nowrap">Updated</th>
                  {canEdit && <th className="px-4 py-3 whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 7} className="text-center py-10 text-slate-400">
                      No blog posts found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-blue-500/5 transition-colors group"
                    >
                      {canEdit && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selected.has(post.id)}
                            onChange={() => toggleSelect(post.id)}
                            className="accent-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap max-w-[200px] sm:max-w-[250px] overflow-hidden">
                        <Link
                          href={canEdit ? `/admin/blog/${post.id}/edit` : `/blog/${post.slug}`}
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
                      {canEdit && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link href={`/admin/blog/${post.id}/edit`}>
                            <AdminButton variant="ghost" size="sm">Edit</AdminButton>
                          </Link>
                        </td>
                      )}
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
