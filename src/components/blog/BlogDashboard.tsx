"use client"

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { 
  ChevronRight, DollarSign, Heart, Binary, Wrench, Briefcase, Home, GraduationCap, Calendar, Laptop, FlaskConical, ChevronDown,
  TrendingUp, Building, BookOpen, Banknote, Receipt, User, Search, X, Clock, ArrowRight, Filter, Star, ChevronLeft
} from 'lucide-react'
import { BlogPost, formatDate } from '@/lib/blogData'
import { toolsData } from '@/lib/toolsData'
import { Badge } from '@/components/ui/badge'

import { localizeSubcategoryName, localizeToolMeta } from '@/lib/toolLocalization'

interface BlogDashboardProps {
  posts: BlogPost[]
  language: string
  dict: any
}

type DashboardPost = BlogPost & {
  toolId?: string
  subcategoryKey?: string
}

type DashboardTool = {
  id: string
  title: string
  description: string
}

type DashboardSubcategory = {
  key: string
  name: string
  calculators: DashboardTool[]
  toolIds: string[]
  postCount: number
}

const FINANCIAL_SUBCATEGORY_ORDER: string[] = [
  'loan', 'investment', 'tax', 'currency', 'time-based-finance',
  'banking', 'insurance', 'real-estate', 'credit-card', 'retirement', 'business', 'misc',
]

const POPULAR_FINANCIAL_POSTS_BY_TOOL_ID: string[] = [
  'sip-calculator', 'gst-calculator', 'income-tax-calculator', 'currency-converter',
  'personal-loan-emi', 'savings-account-interest', 'life-insurance-calculator',
  'rent-vs-buy', 'credit-card-payoff', 'fire-calculator', 'profit-margin', 'net-worth',
]

const DISCOVERY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'how-to', label: 'How-to' },
  { id: 'example', label: 'Examples' },
  { id: 'faq', label: 'FAQ' },
] as const

type DiscoveryFilterId = (typeof DISCOVERY_FILTERS)[number]['id']
const POSTS_PER_PAGE = 12

function matchesDiscoveryFilter(post: DashboardPost, filterId: DiscoveryFilterId) {
  if (filterId === 'all') return true

  const title = post.title.toLowerCase()
  const description = post.description.toLowerCase()
  const tags = post.tags.map((tag) => tag.toLowerCase())
  const text = `${title} ${description} ${tags.join(' ')}`

  if (filterId === 'beginner') {
    return ['beginner', 'basics', 'start', 'introduction', 'guide'].some((term) => text.includes(term))
  }

  if (filterId === 'how-to') {
    return ['how-to', 'how to', 'tutorial', 'steps', 'use'].some((term) => text.includes(term))
  }

  if (filterId === 'example') {
    return ['example', 'sample', 'case study', 'scenario'].some((term) => text.includes(term))
  }

  if (filterId === 'faq') {
    return ['faq', 'frequently asked', 'questions'].some((term) => text.includes(term))
  }

  return true
}

/* ─── Shared Post Card ─── */
function PostCard({ post, withLocale, categoryMeta, compact }: {
  post: DashboardPost
  withLocale: (p: string) => string
  categoryMeta: Record<string, { name: string; icon: any; color: string }>
  compact?: boolean
}) {
  const meta = categoryMeta[post.category]
  const CategoryIcon = meta?.icon || BookOpen
  const color = meta?.color || 'from-primary/20 to-primary/10'

  return (
    <Link
      href={withLocale(`/blog/${post.slug}`)}
      className={
        "group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 " +
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 " +
        (compact ? "min-h-[160px]" : "min-h-[200px]")
      }
    >
      {/* Top gradient accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className={compact ? "p-4 flex flex-col flex-1" : "p-5 flex flex-col flex-1"}>
        {/* Category & reading time */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
            <CategoryIcon className="h-4 w-4 text-white" />
          </div>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 capitalize font-medium">
            {meta?.name || post.category}
          </Badge>
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime} min
          </span>
        </div>

        {/* Title */}
        <h3 className={
          "font-bold leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2 notranslate " +
          (compact ? "text-sm" : "text-base")
        } translate="no">
          {post.title}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 notranslate" translate="no">
            {post.description}
          </p>
        )}

        {/* Footer */}
        <div className={
          "flex items-center justify-between text-[11px] text-muted-foreground " +
          (compact ? "mt-3 pt-2" : "mt-4 pt-3") + " border-t border-border/40"
        }>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.author.name}
          </span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </Link>
  )
}

export function BlogDashboard({ posts, language, dict }: BlogDashboardProps) {
  const prefix = language && language !== 'en' ? `/${language}` : ''
  const withLocale = (path: string) => `${prefix}${path}`
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Desktop dashboard should scroll inside panels (not the whole page).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      if (mq.matches) document.body.classList.add('home-dashboard-lock')
      else document.body.classList.remove('home-dashboard-lock')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      document.body.classList.remove('home-dashboard-lock')
    }
  }, [])

  /* ─── Search ─── */
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const [activeDiscoveryFilter, setActiveDiscoveryFilter] = useState<DiscoveryFilterId>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const hasHydratedUrlState = useRef(false)

  /* ─── Mobile category sheet ─── */
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const categoryMeta = useMemo(() => {
    return {
      financial: { name: dict.nav?.financial || 'Financial', icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
      math: { name: dict.nav?.math || 'Math', icon: Binary, color: 'from-purple-500 to-indigo-500' },
      construction: { name: dict.nav?.construction || 'Construction', icon: Wrench, color: 'from-orange-500 to-red-500' },
      business: { name: dict.nav?.business || 'Business', icon: Briefcase, color: 'from-amber-500 to-yellow-500' },
      everyday: { name: dict.nav?.everyday || 'Everyday', icon: Home, color: 'from-green-500 to-emerald-500' },
      education: { name: dict.nav?.education || 'Education', icon: GraduationCap, color: 'from-sky-500 to-blue-500' },
      datetime: { name: dict.nav?.datetime || 'Date & Time', icon: Calendar, color: 'from-teal-500 to-cyan-500' },
      technology: { name: dict.nav?.technology || 'Technology', icon: Laptop, color: 'from-indigo-500 to-purple-500' },
      scientific: { name: dict.nav?.science || 'Scientific', icon: FlaskConical, color: 'from-violet-500 to-fuchsia-500' },
      investments: { name: 'Investments', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
      loans: { name: 'Loans', icon: Banknote, color: 'from-orange-500 to-red-500' },
      health: { name: dict.nav?.health || 'Health & Fitness', icon: Heart, color: 'from-pink-500 to-rose-500' },
      'real-estate': { name: 'Real Estate', icon: Building, color: 'from-amber-500 to-yellow-500' },
      tax: { name: 'Tax', icon: Receipt, color: 'from-purple-500 to-indigo-500' },
      general: { name: 'General', icon: BookOpen, color: 'from-slate-500 to-gray-500' },
    } as Record<string, { name: string; icon: any; color: string }>
  }, [dict])

  const categories = useMemo(() => {
    const order = [
      'all',
      'latest',
      'financial',
      'health',
      'math',
      'construction',
      'business',
      'everyday',
      'education',
      'datetime',
      'technology',
      'scientific',
    ]

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const latestCount = posts.filter(p => new Date(p.publishedAt) >= sevenDaysAgo).length

    const perCategory = order
      .filter((id) => id !== 'all' && id !== 'latest')
      .filter((id) => Boolean((toolsData as any)[id]) && Boolean((categoryMeta as any)[id]))
      .map((id) => {
        const meta = (categoryMeta as any)[id]
        const count = posts.filter((post) => post.category === id).length
        return {
          id,
          name: meta?.name as string || id,
          icon: meta?.icon || BookOpen,
          color: meta?.color || 'from-primary/20 to-primary/10',
          count,
          isSpecial: false
        }
      })

    return [
      { id: 'all', name: dict.blog?.allCategories || 'All', icon: Star, color: 'from-primary to-primary', count: posts.length, isSpecial: true },
      { id: 'latest', name: dict.blog?.latest7Days || 'Latest (7d)', icon: Clock, color: 'from-emerald-500 to-teal-500', count: latestCount, isSpecial: true },
      ...perCategory,
    ]
  }, [categoryMeta, posts, dict])

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all')
  const [activeSubcategoryKey, setActiveSubcategoryKey] = useState<string | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

  const selectCategory = (id: string) => {
    setActiveCategoryId(id)
    setSearchQuery('')
    setCurrentPage(1)
    if (id === 'all') {
      setActiveSubcategoryKey(null)
      setExpandedCategoryId(null)
      return
    }
    setActiveSubcategoryKey(null)
    setExpandedCategoryId(id)
  }

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  const activeSubcategories = useMemo((): DashboardSubcategory[] => {
    if (activeCategoryId === 'all' || activeCategoryId === 'latest') return []
    
    const category = (toolsData as any)[activeCategoryId]
    if (!category) return []
    const categoryPosts = posts.filter((post) => post.category === activeCategoryId) as DashboardPost[]

    const subcategoryList: DashboardSubcategory[] = Object.entries(category.subcategories ?? {})
      .map(([key, sub]: any) => {
        const calculators: DashboardTool[] = (sub.calculators ?? [])
          .map((tool: any) => ({
            id: String(tool.id),
            title: localizeToolMeta({ dict, toolId: String(tool.id), fallbackTitle: String(tool.title) }).title,
            description: String(tool.description),
          }))
        const toolIds = calculators.map((tool) => tool.id)
        const toolIdSet = new Set(toolIds)
        const postCount = categoryPosts.filter((post) =>
          post.subcategoryKey === String(key) || (post.toolId ? toolIdSet.has(post.toolId) : false)
        ).length

        return { 
          key: String(key), 
          name: localizeSubcategoryName(dict, String(key), String(sub.name)), 
          calculators,
          toolIds,
          postCount,
        }
      })
      .filter((s) => s.calculators.length > 0 && s.postCount > 0)
      
    if (activeCategoryId === 'financial') {
      const byKey = new Map(subcategoryList.map(s => [s.key, s]))
      const orderedKeys = FINANCIAL_SUBCATEGORY_ORDER.filter((k) => byKey.has(k))
      const remaining = subcategoryList.map(s => s.key).filter((k) => !orderedKeys.includes(k)).sort()
      return [...orderedKeys, ...remaining].map(k => byKey.get(k) as DashboardSubcategory)
    }

    return subcategoryList
  }, [activeCategoryId, dict, posts])

  const selectedSubcategory = useMemo(() => {
    if (!activeSubcategoryKey) return null
    return activeSubcategories.find((s) => s.key === activeSubcategoryKey) ?? null
  }, [activeSubcategories, activeSubcategoryKey])

  const categoryPopularPosts = useMemo((): DashboardPost[] => {
    if (activeCategoryId === 'all') return []
    const inCategory = posts.filter((p) => p.category === activeCategoryId) as DashboardPost[]
    if (activeCategoryId === 'financial') {
      const priorityIndex = new Map<string, number>()
      POPULAR_FINANCIAL_POSTS_BY_TOOL_ID.forEach((id, i) => priorityIndex.set(id, i))
      const ordered = [...inCategory].sort((a, b) => {
        const ai = a.toolId && priorityIndex.has(a.toolId) ? priorityIndex.get(a.toolId)! : Infinity
        const bi = b.toolId && priorityIndex.has(b.toolId) ? priorityIndex.get(b.toolId)! : Infinity
        return ai !== bi ? ai - bi : a.title.localeCompare(b.title)
      })
      return ordered.slice(0, 12)
    }
    return [...inCategory].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 12)
  }, [activeCategoryId, posts])

  const filteredPosts = useMemo((): DashboardPost[] => {
    let result: DashboardPost[]
    if (activeCategoryId === 'all') {
      result = posts as DashboardPost[]
    } else if (activeCategoryId === 'latest') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      result = (posts as DashboardPost[]).filter(p => new Date(p.publishedAt) >= sevenDaysAgo)
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    } else if (!activeSubcategoryKey) {
      result = posts.filter((p) => p.category === activeCategoryId) as DashboardPost[]
    } else {
      const selectedSubcategoryToolIds = new Set(selectedSubcategory?.toolIds || [])
      result = posts.filter((p) =>
        p.category === activeCategoryId && (
          (p as DashboardPost).subcategoryKey === activeSubcategoryKey ||
          ((p as DashboardPost).toolId ? selectedSubcategoryToolIds.has((p as DashboardPost).toolId as string) : false)
        )
      ) as DashboardPost[]
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      )
    }

    result = result.filter((post) => matchesDiscoveryFilter(post, activeDiscoveryFilter))
    return result
  }, [posts, activeCategoryId, activeDiscoveryFilter, activeSubcategoryKey, searchQuery, selectedSubcategory])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategoryId, activeDiscoveryFilter, activeSubcategoryKey, searchQuery])

  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all'
    const urlSubcategory = searchParams.get('subcategory')
    const urlQuery = searchParams.get('q') || ''
    const rawFilter = searchParams.get('filter') || 'all'
    const urlFilter = DISCOVERY_FILTERS.some((item) => item.id === rawFilter)
      ? rawFilter as DiscoveryFilterId
      : 'all'
    const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10)
    const urlPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

    setSearchQuery((current) => current === urlQuery ? current : urlQuery)
    setActiveDiscoveryFilter((current) => current === urlFilter ? current : urlFilter)
    setActiveCategoryId((current) => current === urlCategory ? current : urlCategory)
    setExpandedCategoryId((current) => {
      if (urlCategory === 'all' || urlCategory === 'latest') return null
      return current === urlCategory ? current : urlCategory
    })
    setActiveSubcategoryKey((current) => current === (urlSubcategory || null) ? current : (urlSubcategory || null))
    setCurrentPage((current) => current === urlPage ? current : urlPage)

    hasHydratedUrlState.current = true
  }, [searchParams])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE))
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(start, start + POSTS_PER_PAGE)
  }, [currentPage, filteredPosts])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!hasHydratedUrlState.current) return

    const params = new URLSearchParams(searchParams.toString())

    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    else params.delete('q')

    if (activeCategoryId !== 'all') params.set('category', activeCategoryId)
    else params.delete('category')

    if (activeSubcategoryKey) params.set('subcategory', activeSubcategoryKey)
    else params.delete('subcategory')

    if (activeDiscoveryFilter !== 'all') params.set('filter', activeDiscoveryFilter)
    else params.delete('filter')

    if (currentPage > 1) params.set('page', String(currentPage))
    else params.delete('page')

    const query = params.toString()
    const currentQuery = searchParams.toString()
    if (query === currentQuery) return

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [activeCategoryId, activeDiscoveryFilter, activeSubcategoryKey, currentPage, pathname, router, searchParams, searchQuery])

  /* ─── Breadcrumb ─── */
  const breadcrumbs = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      { label: dict.blog?.title || 'Blog', onClick: () => selectCategory('all') }
    ]
    if (activeCategoryId !== 'all' && activeCategory) {
      items.push({ label: activeCategory.name, onClick: selectedSubcategory ? () => { setActiveSubcategoryKey(null) } : undefined })
    }
    if (selectedSubcategory) {
      items.push({ label: selectedSubcategory.name })
    }
    return items
  }, [activeCategoryId, activeCategory, selectedSubcategory, dict])

  /* ─── Search bar component (reusable) ─── */
  const searchBar = (
    <div className={
      "relative flex items-center transition-all duration-300 " +
      (searchFocused ? "ring-2 ring-primary/30" : "") +
      " rounded-xl border border-border/60 bg-secondary/30 overflow-hidden"
    }>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={searchRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        placeholder={dict.blog?.searchPlaceholder || "Search articles..."}
        className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
          className="absolute right-3 p-0.5 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  )

  const discoveryFilterBar = (
    <div className="flex flex-wrap gap-2">
      {DISCOVERY_FILTERS.map((filter) => {
        const isActive = activeDiscoveryFilter === filter.id
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveDiscoveryFilter(filter.id)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all " +
              (isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/20 hover:text-foreground")
            }
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )

  const paginationControls = totalPages > 1 ? (
    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  ) : null

  return (
    <div className="bg-background min-h-screen">
      {/* ════════════════════════════════════════════════ */}
      {/* ═══ MOBILE & TABLET VIEW ═══ */}
      {/* ════════════════════════════════════════════════ */}
      <div className="lg:hidden min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/40">
          <div className="px-4 pt-4 pb-3 space-y-3">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{dict.blog?.title || 'Blog'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredPosts.length} {dict.blog?.articles || 'articles'}
                  {activeCategoryId !== 'all' && ` in ${activeCategory?.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className={
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all " +
                  (activeCategoryId !== 'all'
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/50 border-border/60 text-muted-foreground")
                }
              >
                <Filter className="h-3.5 w-3.5" />
                {activeCategoryId !== 'all' ? activeCategory?.name : (dict.blog?.filter || 'Filter')}
              </button>
            </div>

            {/* Search */}
            {searchBar}
          </div>

          {/* Category pills - horizontal scroll */}
          <div className="px-4 pb-3 -mx-0.5">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {categories.map((c) => {
                const isActive = c.id === activeCategoryId
                const CategoryIcon = c.icon || BookOpen
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { selectCategory(c.id); setMobileFilterOpen(false) }}
                    className={
                      "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 " +
                      (isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground")
                    }
                  >
                    <CategoryIcon className="h-3 w-3" />
                    {c.name}
                    <span className={
                      "rounded-full px-1.5 py-0 text-[10px] " +
                      (isActive ? "bg-white/20" : "bg-secondary")
                    }>
                      {c.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile Filter Bottom Sheet */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setMobileFilterOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border/60 max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              
              <div className="px-4 pb-2 flex items-center justify-between">
                <h3 className="text-base font-bold">{dict.blog?.categories || 'Categories'}</h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[55vh] px-4 pb-6 space-y-1">
                {categories.map((c) => {
                  const isActive = c.id === activeCategoryId
                  const CategoryIcon = c.icon || BookOpen
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { selectCategory(c.id); setMobileFilterOpen(false) }}
                      className={
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all " +
                        (isActive
                          ? "bg-primary/10 border border-primary/30 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")
                      }
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                        <CategoryIcon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <span className="flex-1 text-left">{c.name}</span>
                      <span className={
                        "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        (isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")
                      }>
                        {c.count}
                      </span>
                      {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="px-4 py-4">
          {/* Breadcrumb (mobile) */}
          {activeCategoryId !== 'all' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {b.onClick ? (
                    <button type="button" onClick={b.onClick} className="hover:text-primary transition-colors">
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-foreground font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Category overview on "All" */}
          {activeCategoryId === 'all' && !searchQuery && activeDiscoveryFilter === 'all' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {categories.filter((c) => c.id !== 'all' && c.id !== 'latest' && c.count > 0).map((c) => {
                const CategoryIcon = c.icon || BookOpen
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCategory(c.id)}
                    className="group text-left rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <CategoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {c.count} {dict.blog?.articles || 'articles'}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="mb-4">
            {discoveryFilterBar}
          </div>

          {/* Subcategory pills (mobile) */}
          {activeSubcategories.length > 0 && activeCategoryId !== 'all' && (
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  type="button"
                  onClick={() => setActiveSubcategoryKey(null)}
                  className={
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all " +
                    (!activeSubcategoryKey
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-secondary/50 text-muted-foreground")
                  }
                >
                  All
                </button>
                {activeSubcategories.map((sub) => (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => setActiveSubcategoryKey(sub.key)}
                    className={
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all " +
                      (activeSubcategoryKey === sub.key
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-secondary/50 text-muted-foreground")
                    }
                  >
                    {sub.name} ({sub.postCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results info */}
          {(searchQuery || activeDiscoveryFilter !== 'all') && (
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}{searchQuery ? ` for "${searchQuery}"` : ` in ${DISCOVERY_FILTERS.find((item) => item.id === activeDiscoveryFilter)?.label || 'All'}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setActiveDiscoveryFilter('all')
                }}
                className="text-xs text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Mobile post cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedPosts.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                withLocale={withLocale}
                categoryMeta={categoryMeta}
                compact
              />
            ))}
          </div>

          {paginationControls && (
            <div className="mt-4">
              {paginationControls}
            </div>
          )}

          {filteredPosts.length === 0 && (activeCategoryId !== 'all' || searchQuery || activeDiscoveryFilter !== 'all') && (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchQuery || activeDiscoveryFilter !== 'all' ? 'No articles found' : 'No posts in this category'}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery || activeDiscoveryFilter !== 'all' ? 'Try different keywords or clear your search' : 'Check back later for new content'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* ═══ DESKTOP VIEW ═══ */}
      {/* ════════════════════════════════════════════════ */}
      <div className="hidden lg:block h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full w-full box-border px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-[280px_1fr] gap-6">
            
            {/* ─── Sidebar ─── */}
            <aside className="h-full">
              <div className="h-full rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {/* Sidebar header */}
                  <div className="sticky top-0 z-10 border-b border-border/40 bg-card/95 backdrop-blur-lg px-4 py-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {dict.blog?.categories || 'Categories'}
                    </div>
                  </div>

                  <div className="p-3 space-y-0.5">
                    {categories.map((c) => {
                      const isActive = c.id === activeCategoryId
                      const isExpanded = c.id !== 'all' && c.id !== 'latest' && expandedCategoryId === c.id
                      const disabled = c.id !== 'all' && c.id !== 'latest' && c.count === 0
                      const CategoryIcon = c.icon || BookOpen
                      
                      return (
                        <div key={c.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (disabled) return
                              if (c.id === 'all') { selectCategory('all'); return }
                              if (c.id === 'latest') { selectCategory('latest'); return }
                              if (c.id === activeCategoryId) {
                                setExpandedCategoryId((prev) => (prev === c.id ? null : c.id))
                                return
                              }
                              selectCategory(c.id)
                            }}
                            disabled={disabled}
                            className={
                              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 " +
                              (disabled
                                ? "text-muted-foreground/40 cursor-not-allowed"
                                : isActive
                                ? "bg-primary/10 text-foreground font-semibold border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
                            }
                          >
                            <div className={
                              "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all " +
                              (isActive
                                ? `bg-gradient-to-br ${c.color} shadow-sm`
                                : 'bg-secondary/70')
                            }>
                              <CategoryIcon className={
                                "h-4 w-4 transition-colors " +
                                (isActive ? 'text-white' : 'text-muted-foreground')
                              } />
                            </div>
                            
                            <span className="truncate flex-1 text-left">{c.name}</span>
                            
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className={
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                (isActive
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-secondary/80 text-muted-foreground')
                              }>
                                {c.count}
                              </span>
                              {isExpanded && isActive && activeSubcategories.length > 0 && (
                                <ChevronDown className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                          </button>

                          {/* Subcategories */}
                          {isExpanded && isActive && activeSubcategories.length > 0 && (
                            <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-primary/20 pl-3">
                              <div className="flex items-center justify-between px-1 py-1">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subcategories</span>
                                {activeSubcategoryKey && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveSubcategoryKey(null)}
                                    className="text-[10px] text-primary hover:underline"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              {activeSubcategories.map((sub) => {
                                const isSubActive = sub.key === activeSubcategoryKey
                                return (
                                  <div key={sub.key}>
                                    <button
                                      type="button"
                                      onClick={() => setActiveSubcategoryKey(isSubActive ? null : sub.key)}
                                      className={
                                        "w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-all " +
                                        (isSubActive
                                          ? "bg-primary/10 text-foreground font-medium border border-primary/20"
                                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40")
                                      }
                                    >
                                      <span className="truncate flex-1 text-left">{sub.name}</span>
                                      <span className={
                                        "ml-2 shrink-0 rounded-full px-1.5 py-0 text-[10px] " +
                                        (isSubActive ? 'bg-primary/20 text-primary' : 'bg-secondary/80 text-muted-foreground')
                                      }>
                                        {sub.postCount}
                                      </span>
                                    </button>
                                    
                                    {/* TOOLS ACCORDION */}
                                    {isSubActive && sub.calculators.length > 0 && (
                                      <div className="mt-1 mb-2 ml-2 space-y-0.5 border-l-2 border-primary/10 pl-2">
                                        {sub.calculators.map(tool => (
                                          <Link
                                            key={tool.id}
                                            href={withLocale(`/calculator/${tool.id}`)}
                                            className="block w-full text-left rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 truncate transition-colors notranslate"
                                            translate="no"
                                          >
                                            {tool.title}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* ─── Main Content ─── */}
            <section className="min-w-0 h-full overflow-hidden">
              <div className="h-full overflow-y-auto rounded-2xl border border-border/60 bg-card">
                {/* Sticky header */}
                <div className="sticky top-0 z-10 border-b border-border/40 bg-card/95 backdrop-blur-lg px-6 py-4 space-y-3">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {breadcrumbs.map((b, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="h-3 w-3" />}
                        {b.onClick ? (
                          <button type="button" onClick={b.onClick} className="hover:text-primary transition-colors">
                            {b.label}
                          </button>
                        ) : (
                          <span className="text-foreground font-medium">{b.label}</span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {selectedSubcategory ? selectedSubcategory.name : (activeCategory?.name || 'Blog')}
                      </h1>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {filteredPosts.length} {dict.blog?.articles || 'articles'}
                      </p>
                    </div>
                    {/* Desktop search */}
                    <div className="w-72">
                      {searchBar}
                    </div>
                  </div>

                  <div>
                    {discoveryFilterBar}
                  </div>
                </div>

                <div className="px-6 py-6">
                  {/* Search results info */}
                  {(searchQuery || activeDiscoveryFilter !== 'all') && (
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}{searchQuery ? ` for "${searchQuery}"` : ` in ${DISCOVERY_FILTERS.find((item) => item.id === activeDiscoveryFilter)?.label || 'All'}`}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('')
                          setActiveDiscoveryFilter('all')
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  )}

                  {/* Category grid (when "All" selected and no search) */}
                  {activeCategoryId === 'all' && !searchQuery && activeDiscoveryFilter === 'all' && (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                      {categories.filter((c) => c.id !== 'all' && c.id !== 'latest' && c.count > 0).map((c) => {
                        const CategoryIcon = c.icon || BookOpen
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCategory(c.id)}
                            className="group text-left rounded-2xl border border-border/50 bg-gradient-to-br from-background to-secondary/20 p-6 hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                                <CategoryIcon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-base truncate group-hover:text-primary transition-colors">
                                  {c.name}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-sm text-muted-foreground">
                                    {c.count} {dict.blog?.articles || 'articles'}
                                  </span>
                                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* All posts (when "All" selected with search active) OR Latest */}
                  {((activeCategoryId === 'all' && (searchQuery || activeDiscoveryFilter !== 'all')) || activeCategoryId === 'latest') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedPosts.map((post) => (
                          <PostCard key={post.slug} post={post} withLocale={withLocale} categoryMeta={categoryMeta} />
                        ))}
                      </div>
                      {paginationControls}
                    </div>
                  )}

                  {/* Recent posts under all categories */}
                  {activeCategoryId === 'all' && !searchQuery && activeDiscoveryFilter === 'all' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">{dict.blog?.latestArticles || 'Latest Articles'}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(posts as DashboardPost[])
                          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
                          .slice(0, 9)
                          .map((post) => (
                            <PostCard key={post.slug} post={post} withLocale={withLocale} categoryMeta={categoryMeta} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Category selected - show posts */}
                  {activeCategoryId !== 'all' && activeCategoryId !== 'latest' && (
                    <div className="space-y-4">
                      {!searchQuery && !selectedSubcategory && activeDiscoveryFilter === 'all' && (
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            {dict.blog?.popularPosts || 'Popular posts'}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {(selectedSubcategory ? filteredPosts : categoryPopularPosts).length} posts
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(selectedSubcategory || searchQuery || activeDiscoveryFilter !== 'all' ? paginatedPosts : categoryPopularPosts).map((post) => (
                          <PostCard key={post.slug} post={post} withLocale={withLocale} categoryMeta={categoryMeta} />
                        ))}
                      </div>

                      {!selectedSubcategory && !searchQuery && activeSubcategories.length > 0 && (
                        <p className="pt-2 text-center text-xs text-muted-foreground">
                          {dict.blog?.selectSubcategory || 'Select a subcategory from the sidebar to see all posts'}
                        </p>
                      )}

                      {(selectedSubcategory || searchQuery || activeDiscoveryFilter !== 'all') && paginationControls}
                    </div>
                  )}

                  {/* Empty state */}
                  {filteredPosts.length === 0 && (activeCategoryId !== 'all' || searchQuery || activeDiscoveryFilter !== 'all') && (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
                        <Search className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {searchQuery || activeDiscoveryFilter !== 'all' ? 'No articles found' : 'No posts in this category'}
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        {searchQuery || activeDiscoveryFilter !== 'all' ? 'Try different keywords or clear your search' : 'Check back later for new content'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
