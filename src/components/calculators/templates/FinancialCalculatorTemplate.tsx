"use client"

import { ReactNode, useState, useEffect, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import {
  Calculator, LucideIcon, Download, Printer, Share2, RotateCcw,
  FileText, FileSpreadsheet, FileJson, FileCode, Copy, FileType,
  Zap, ZapOff, PieChart, TrendingUp, Image, FileImage, Database,
  Lock, FileArchive, Code, Link as LinkIcon, Presentation, FileKey, X, Settings,
  Star, Bookmark, History, Trash2, RefreshCw, Mic, MicOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSettings } from "@/components/providers/SettingsProvider"
import { getMergedTranslations } from "@/lib/translations"
import { getDictString, localizeToolMeta } from "@/lib/toolLocalization"
import { generateReport } from "@/lib/downloadUtils"
import { CalculatorSchema, FAQSchema, BreadcrumbSchema } from "@/components/seo/AdvancedSchema"
import { AIRecommendations } from "@/components/ui-ai/AIRecommendations"
import { toolsData } from "@/lib/toolsData"
import { CustomDownloadModal } from "@/components/CustomDownloadModal"

interface FinancialCalculatorTemplateProps {
  title: string
  description: string
  icon?: LucideIcon
  inputs: ReactNode
  result: ReactNode
  charts?: ReactNode
  schedule?: ReactNode
  calculate: () => void
  calculateLabel?: string
  defaultAutoCalculate?: boolean
  onClear?: () => void
  onRestoreAction?: (values: any[]) => void
  onDownload?: (format: string) => void
  values?: any[]
  seoContent?: ReactNode
  category?: string
  calculatorUrl?: string
  faqs?: Array<{ question: string; answer: string }>
  calculatorId?: string
  onSave?: () => void
}

export interface DownloadOptions {
  includeSummary: boolean;
  includeChart: boolean;
  includeSchedule: boolean;
  scheduleRange: 'all' | '1yr' | '5yr' | 'custom';
  customRangeStart?: number;
  customRangeEnd?: number;
}

export function FinancialCalculatorTemplate({
  title,
  description,
  icon: Icon = Calculator,
  inputs,
  result,
  charts,
  schedule,
  calculate,
  calculateLabel = "Calculate",
  defaultAutoCalculate = false,
  onClear,
  onRestoreAction,
  onDownload,
  values = [],
  seoContent,
  category = "Financial",
  calculatorUrl,
  faqs,
  calculatorId,
  onSave
}: FinancialCalculatorTemplateProps & { onDownload?: (format: string, options?: DownloadOptions) => void }) {
  const { data: session } = useSession()
  const { language } = useSettings()
  const dict = useMemo(() => getMergedTranslations(language), [language])

  const categoryLabel = useMemo(() => {
    const raw = String(category || "Financial")
    return raw.replace(/([a-z])([A-Z])/g, "$1 $2").trim() || "Financial"
  }, [category])

  const subcategoryLabel = useMemo(() => {
    if (!calculatorId) return null

    for (const categoryItem of Object.values(toolsData)) {
      for (const subcategory of Object.values(categoryItem.subcategories)) {
        const hit = subcategory.calculators?.some((t) => t.id === calculatorId)
        if (hit) {
          const raw = String(subcategory.name || "").trim()
          if (!raw) return null
          // Remove leading emoji/symbols for a cleaner pill label.
          return raw.replace(/^[^A-Za-z0-9]+\s*/, "").trim() || raw
        }
      }
    }
    return null
  }, [calculatorId])

  const resultsRef = useRef<HTMLDivElement | null>(null)

  const { title: displayTitle, description: displayDescription } = useMemo(
    () =>
      localizeToolMeta({
        dict,
        toolId: calculatorId,
        fallbackTitle: title,
        fallbackDescription: description,
      }),
    [dict, calculatorId, title, description]
  )

  const resolvedCalculateLabel =
    calculateLabel === 'Calculate' ? getDictString(dict, 'common.calculate', 'Calculate') : calculateLabel
  
  const [isAutoCalculate, setIsAutoCalculate] = useState(defaultAutoCalculate)
  const [downloadMode, setDownloadMode] = useState<'choose' | 'auto' | 'custom'>('choose')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [pendingFormat, setPendingFormat] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<Array<{ at: string; values: any[] }>>([])
  const lastHistoryHashRef = useRef<string | null>(null)
  const [restoreSnapshot, setRestoreSnapshot] = useState<any[] | null>(null)
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    includeSummary: true,
    includeChart: true,
    includeSchedule: true,
    scheduleRange: 'all',
    customRangeStart: 1,
    customRangeEnd: 10
  })

  const hasResult = Boolean(result)

  const handleCalculateClick = () => {
    calculate()
    // Ensure users see the output immediately (especially on mobile where results are below).
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const handleDeleteInputs = () => {
    if (!onClear) return

    // Snapshot current values so user can restore after clearing.
    const snapshot = Array.isArray(values) ? [...values] : []
    setRestoreSnapshot(snapshot)

    // First clear result + reset any calculator-owned UI state.
    onClear()

    // Then clear inputs to "zero" so user can enter fresh values.
    // (Numbers -> 0, booleans -> false, everything else -> null)
    if (onRestoreAction && snapshot.length > 0) {
      const cleared = snapshot.map((v) => {
        if (typeof v === "number") return 0
        if (typeof v === "boolean") return false
        return null
      })
      onRestoreAction(cleared)
    }
  }

  const handleRestoreInputs = () => {
    if (!onRestoreAction) return
    if (!restoreSnapshot) return

    onRestoreAction(restoreSnapshot)
  }

  const historyStorageKey = calculatorId ? `calculatorHistory:${calculatorId}` : null

  const refreshHistory = () => {
    if (!historyStorageKey) return
    try {
      const raw = localStorage.getItem(historyStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setHistoryItems(Array.isArray(parsed) ? parsed : [])
    } catch {
      setHistoryItems([])
    }
  }

  useEffect(() => {
    if (!historyStorageKey) return
    refreshHistory()
  }, [historyStorageKey])

  useEffect(() => {
    if (!historyStorageKey) return
    if (!hasResult) return

    let hash = ""
    try {
      hash = JSON.stringify(values)
    } catch {
      return
    }

    if (!hash) return
    if (lastHistoryHashRef.current === hash) return
    lastHistoryHashRef.current = hash

    try {
      const raw = localStorage.getItem(historyStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      const existing: Array<{ at: string; values: any[] }> = Array.isArray(parsed) ? parsed : []
      const next = [{ at: new Date().toISOString(), values }, ...existing]
        .slice(0, 10)

      localStorage.setItem(historyStorageKey, JSON.stringify(next))
      setHistoryItems(next)
    } catch {
      // ignore
    }
  }, [historyStorageKey, hasResult, title, JSON.stringify(values)])

  const clearHistory = () => {
    if (!historyStorageKey) return
    try {
      localStorage.removeItem(historyStorageKey)
    } catch {
      // ignore
    }
    setHistoryItems([])
  }

  const copyHistoryItem = async (item: { at: string; values: any[] }) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ calculatorId, title, at: item.at, values: item.values }, null, 2))
      toast.success("Inputs copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  // Check status on load
  useEffect(() => {
    const checkStatus = async () => {
      if (!calculatorId) return

      // Check Favorites
      if (session?.user) {
        try {
          const res = await fetch('/api/user/favorites')
          if (res.ok) {
            const data = await res.json()
            const exists = data.favorites?.some((f: any) => f.calculatorId === calculatorId)
            setIsFavorite(!!exists)
          }
        } catch (e) {
          console.error("Failed to check favorite status", e)
        }
      } else {
        const favorites = JSON.parse(localStorage.getItem('favoriteCalculators') || '[]')
        const exists = favorites.some((f: any) => f.id === calculatorId)
        setIsFavorite(exists)
      }

      // Check Saved (This is tricky because "Saved" usually means a specific calculation result, not the tool itself)
      // But maybe the user wants to "Bookmark" the tool?
      // The user said "Hamare tools Mein sev karne ke liye option kahan de raha... Yahan per sev ho jaega"
      // Usually "Save" means save the *result*. "Favorite" means save the *tool*.
      // So "Save" button should probably only be enabled when there is a result.
    }
    checkStatus()
  }, [calculatorId, session])

  const handleToggleFavorite = async () => {
    if (!calculatorId) return

    const newStatus = !isFavorite
    setIsFavorite(newStatus) // Optimistic update

    try {
      if (session?.user) {
        if (newStatus) {
          await fetch('/api/user/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              calculatorId,
              calculatorName: title,
              category,
              description
            })
          })
          toast.success("Added to favorites")
        } else {
          await fetch(`/api/user/favorites?calculatorId=${calculatorId}`, {
            method: 'DELETE'
          })
          toast.success("Removed from favorites")
        }
      } else {
        const favorites = JSON.parse(localStorage.getItem('favoriteCalculators') || '[]')
        if (newStatus) {
          favorites.push({
            id: calculatorId,
            name: title,
            category,
            description,
            usageCount: 1,
            addedAt: new Date()
          })
          toast.success("Added to favorites")
        } else {
          const index = favorites.findIndex((f: any) => f.id === calculatorId)
          if (index > -1) favorites.splice(index, 1)
          toast.success("Removed from favorites")
        }
        localStorage.setItem('favoriteCalculators', JSON.stringify(favorites))
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      setIsFavorite(!newStatus) // Revert
      toast.error("Failed to update favorite")
    }
  }

  const handleSaveResult = async () => {
    if (!hasResult) {
      toast.error("Calculate something first to save it")
      return
    }

    if (onSave) {
      onSave()
    } else {
      // Fallback or info
      toast.error("Save functionality not implemented for this calculator")
    }
  }

  const fallbackOnDownload = async (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const safeBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'calculator'

    const headers = ["Item", "Value"]
    const data: (string | number)[][] = [
      ["Title", title],
      ["Description", description],
      ["Generated On", new Date().toLocaleString()],
      ["Page URL", typeof window !== 'undefined' ? window.location.href : ""],
      ["Note", "This calculator doesn't provide structured export data yet. This file contains basic report metadata."],
    ]

    await generateReport(
      format,
      `${safeBase}_report_${timestamp}`,
      headers,
      data,
      title,
      { "Generated On": new Date().toLocaleString() }
    )
  }

  const initiateDownload = (format: string) => {
    if (downloadMode === 'auto') {
      const run = async () => {
        if (onDownload) {
          onDownload(format, downloadOptions)
        } else {
          await fallbackOnDownload(format)
        }
      }
      toast.promise(run(), {
        loading: `Preparing ${format.toUpperCase()} download...`,
        success: `${format.toUpperCase()} downloaded successfully!`,
        error: 'Download failed. Please try again.',
      })
    } else {
      setPendingFormat(format)
      setShowDownloadModal(true)
    }
  }

  const confirmDownload = () => {
    if (!pendingFormat) return

    const run = async () => {
      if (onDownload) {
        onDownload(pendingFormat, downloadOptions)
        return
      }
      await fallbackOnDownload(pendingFormat)
    }

    run()
      .finally(() => {
        setShowDownloadModal(false)
        setPendingFormat(null)
      })
  }

  useEffect(() => {
    if (isAutoCalculate) {
      calculate()
    }
  }, [isAutoCalculate, JSON.stringify(values)])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: window.location.href,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": displayTitle,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": displayDescription ?? description,
    "featureList": "Financial calculation, PDF export, Excel export, Visual charts",
    "browserRequirements": "Requires JavaScript"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background py-6 md:py-12 px-3 sm:px-4 print:py-0 print:bg-none max-w-[100vw] overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto max-w-5xl max-w-full min-w-0">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10 animate-fadeIn print:hidden">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6 shadow-sm">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{subcategoryLabel ? `${categoryLabel} • ${subcategoryLabel}` : `${categoryLabel} Calculator`}</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 tracking-tight">
            {displayTitle}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {displayDescription ?? description}
          </p>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{displayTitle}</h1>
          <p className="text-muted-foreground">{displayDescription ?? description}</p>
        </div>

        {/* Calculator Card */}
        <div id="calculator-content" className="bg-card border border-border/50 rounded-3xl p-6 md:p-10 shadow-2xl shadow-primary/5 backdrop-blur-sm print:shadow-none print:border-none print:p-0">
          
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 p-2 rounded-2xl bg-secondary/10 border border-border/50 print:hidden">
            
            {/* Left Side: Auto Calculate Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
               <div className="flex items-center gap-2.5">
                  <div className={cn("p-2 rounded-lg transition-colors", isAutoCalculate ? "bg-yellow-500/10 text-yellow-600" : "bg-muted text-muted-foreground")}>
                    {isAutoCalculate ? <Zap className="h-4 w-4 fill-current" /> : <ZapOff className="h-4 w-4" />}
                  </div>
                  <Label htmlFor="auto-calculate" className="text-sm font-medium cursor-pointer select-none">
                    Auto Calculate
                  </Label>
               </div>
               <Switch 
                  id="auto-calculate" 
                  checked={isAutoCalculate}
                  onCheckedChange={setIsAutoCalculate}
                  className="data-[state=checked]:bg-yellow-500 ml-2"
                />
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2">
              {onClear && (hasResult || (restoreSnapshot && restoreSnapshot.length > 0)) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleDeleteInputs} 
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {onRestoreAction && (hasResult || (restoreSnapshot && restoreSnapshot.length > 0)) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestoreInputs}
                  disabled={!restoreSnapshot || restoreSnapshot.length === 0}
                  className="h-10 w-10 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-600/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={restoreSnapshot && restoreSnapshot.length > 0 ? "Reload last inputs" : "Reload last inputs (after delete)"}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              
              <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

              {/* Favorite Button */}
              {calculatorId && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleToggleFavorite} 
                  className={cn(
                    "h-10 w-10 rounded-xl transition-colors",
                    isFavorite ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
              )}

              {/* Save Button */}
              {hasResult && onSave && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSaveResult} 
                  className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  title="Save Calculation"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}

              {/* History Button */}
              {calculatorId && (
                <DropdownMenu open={historyOpen} onOpenChange={setHistoryOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                      title="History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[360px] p-3">
                    <DropdownMenuLabel className="px-2 py-1.5 text-sm font-bold">Recent Inputs</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {historyItems.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">No history yet. Run a calculation to save inputs.</div>
                    ) : (
                      <div className="max-h-[320px] overflow-y-auto">
                        {historyItems.map((item, idx) => (
                          <DropdownMenuItem
                            key={`${item.at}-${idx}`}
                            className="rounded-lg cursor-pointer flex items-center justify-between gap-3"
                            onClick={() => copyHistoryItem(item)}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{new Date(item.at).toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground truncate">Click to copy inputs</div>
                            </div>
                            <Copy className="h-4 w-4" />
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                      onClick={clearHistory}
                      disabled={historyItems.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear history</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleShare} 
                className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePrint} 
                className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </Button>
              
              {hasResult && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => initiateDownload('pdf')}
                    className="hidden md:flex gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-xl px-4 h-10"
                  >
                    <FileType className="h-4 w-4" />
                    <span>PDF</span>
                  </Button>

                  <DropdownMenu onOpenChange={(open) => { if (!open) setDownloadMode('choose') }}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary shadow-sm rounded-xl px-4 h-10"
                        onClick={() => setDownloadMode('choose')}
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(480px,calc(100vw-1rem))] p-3 sm:p-4 max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">

                    {/* ── STEP 1 : Choose mode ──────────────────────────────── */}
                    {downloadMode === 'choose' && (
                      <div className="space-y-3">
                        <DropdownMenuLabel className="px-1 py-1 text-base font-bold">
                          How would you like to download?
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Auto card */}
                        <button
                          onClick={() => setDownloadMode('auto')}
                          className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/20 dark:bg-yellow-400/10">
                            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-200">Auto Download</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Pick a format and download instantly — no extra steps.</p>
                          </div>
                        </button>

                        {/* Custom card */}
                        <button
                          onClick={() => setDownloadMode('custom')}
                          className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/20 dark:bg-blue-400/10">
                            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Custom Download</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Choose colours, font size, row range, watermark and more.</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* ── STEP 2 : Format list (auto or custom) ─────────────── */}
                    {(downloadMode === 'auto' || downloadMode === 'custom') && (
                      <>
                        {/* Header with back button */}
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => setDownloadMode('choose')}
                            className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Back"
                          >
                            ←
                          </button>
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                            downloadMode === 'auto'
                              ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                              : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                          )}>
                            {downloadMode === 'auto'
                              ? <><Zap className="h-3 w-3" /> Auto — click to download</>
                              : <><Settings className="h-3 w-3" /> Custom — click to customise</>
                            }
                          </span>
                        </div>
                        <DropdownMenuSeparator className="mb-3" />

                        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-2">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Basic & Standard</div>
                              <DropdownMenuItem onClick={() => initiateDownload('csv')} className="rounded-lg cursor-pointer">
                                <FileText className="mr-2 h-4 w-4 text-green-600" />
                                <span>CSV (Excel)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('excel')} className="rounded-lg cursor-pointer">
                                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                <span>Excel (.xlsx)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('pdf')} className="rounded-lg cursor-pointer">
                                <FileType className="mr-2 h-4 w-4 text-red-500" />
                                <span>PDF Document</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('json')} className="rounded-lg cursor-pointer">
                                <FileJson className="mr-2 h-4 w-4 text-yellow-500" />
                                <span>JSON Data</span>
                              </DropdownMenuItem>
                            </div>
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Images & Visuals</div>
                              <DropdownMenuItem onClick={() => initiateDownload('png')} className="rounded-lg cursor-pointer">
                                <Image className="mr-2 h-4 w-4 text-purple-500" />
                                <span>PNG Image</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('jpg')} className="rounded-lg cursor-pointer">
                                <FileImage className="mr-2 h-4 w-4 text-orange-500" />
                                <span>JPG Image</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('svg')} className="rounded-lg cursor-pointer">
                                <Code className="mr-2 h-4 w-4 text-pink-500" />
                                <span>SVG Vector</span>
                              </DropdownMenuItem>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Advanced Docs</div>
                              <DropdownMenuItem onClick={() => initiateDownload('html')} className="rounded-lg cursor-pointer">
                                <Code className="mr-2 h-4 w-4 text-orange-600" />
                                <span>HTML Report</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('docx')} className="rounded-lg cursor-pointer">
                                <FileText className="mr-2 h-4 w-4 text-blue-700" />
                                <span>Word (.docx)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('pptx')} className="rounded-lg cursor-pointer">
                                <Presentation className="mr-2 h-4 w-4 text-orange-700" />
                                <span>PowerPoint (.pptx)</span>
                              </DropdownMenuItem>
                            </div>
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Developer Data</div>
                              <DropdownMenuItem onClick={() => initiateDownload('xml')} className="rounded-lg cursor-pointer">
                                <FileCode className="mr-2 h-4 w-4 text-gray-500" />
                                <span>XML Data</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('api')} className="rounded-lg cursor-pointer">
                                <LinkIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                <span>API Link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('sql')} className="rounded-lg cursor-pointer">
                                <Database className="mr-2 h-4 w-4 text-blue-400" />
                                <span>SQL Insert</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('sqlite')} className="rounded-lg cursor-pointer">
                                <Database className="mr-2 h-4 w-4 text-cyan-600" />
                                <span>SQLite DB</span>
                              </DropdownMenuItem>
                            </div>
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Archives & Security</div>
                              <DropdownMenuItem onClick={() => initiateDownload('zip')} className="rounded-lg cursor-pointer">
                                <FileArchive className="mr-2 h-4 w-4 text-yellow-600" />
                                <span>ZIP Archive</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('pdf-encrypted')} className="rounded-lg cursor-pointer">
                                <Lock className="mr-2 h-4 w-4 text-red-600" />
                                <span>Encrypted PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => initiateDownload('zip-encrypted')} className="rounded-lg cursor-pointer">
                                <FileKey className="mr-2 h-4 w-4 text-slate-600" />
                                <span>Password ZIP</span>
                              </DropdownMenuItem>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:gap-10 lg:grid-cols-12 items-start max-w-full min-w-0">
            <div className="lg:col-span-5 space-y-8 max-w-full min-w-0">
              {/* Inputs Section */}
              <div className="space-y-6 bg-secondary/5 p-4 sm:p-6 rounded-2xl border border-border/50">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                  Input Details
                </h3>
                {inputs}
              </div>

              {/* Calculate Button */}
              {!isAutoCalculate && (
                <Button 
                  type="button"
                  onClick={handleCalculateClick} 
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white py-7 text-lg font-semibold shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] rounded-xl"
                >
                  <Calculator className="h-5 w-5 mr-2" /> 
                  {resolvedCalculateLabel}
                </Button>
              )}
            </div>

            {/* Results Section - Right Column on Desktop */}
            {result && (
              <div ref={resultsRef} className="lg:col-span-7 space-y-8 animate-fadeInUp max-w-full min-w-0">
                <div className="h-px w-full bg-border/50 my-8 lg:hidden" />
                
                {/* Key Metrics */}
                <div className="bg-gradient-to-br from-secondary/30 to-background rounded-2xl p-4 sm:p-6 border border-border/50 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                    Summary
                  </h3>
                  {result}
                </div>

                {/* Charts */}
                {charts && (
                  <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm overflow-hidden relative max-w-full min-w-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">3</span>
                      Visual Breakdown
                    </h3>
                    <div className="bg-secondary/5 rounded-xl p-4 md:p-6 flex justify-center min-h-[280px] sm:min-h-[320px] md:min-h-[360px] max-w-full overflow-hidden">
                      <div className="w-full max-w-full">
                        {charts}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule Section - Full Width Bottom */}
          {result && schedule && (
            <div className="mt-16 animate-fadeInUp max-w-full min-w-0">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-12" />
              <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">4</span>
                Amortization Schedule
              </h3>
              <div className="rounded-2xl border border-border/50 shadow-lg bg-card">
                <div className="w-full overflow-x-auto">
                  {schedule}
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations Section */}
          {result && (
            <div className="mt-16 animate-fadeInUp">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-12" />
              <div className="max-w-2xl">
                <AIRecommendations 
                  currentCalculator={calculatorUrl}
                  limit={4}
                />
              </div>
            </div>
          )}

          {/* SEO Content Section */}
          <div className="mt-20 max-w-4xl mx-auto space-y-16 max-w-full min-w-0">
            {seoContent && (
              <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-li:text-muted-foreground">
                {seoContent}
              </div>
            )}
            <GenericFinancialSeo title={title} />
          </div>
        </div>
      </div>
      
      {/* Global AI assistant is mounted in RootLayout to avoid duplicate floating buttons */}

      <CustomDownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        data={values}
        title={displayTitle}
        format={pendingFormat || 'pdf'}
      />
    </div>
  )
}

interface InputGroupProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  helpText?: string
  disabled?: boolean
  enableVoice?: boolean
  voiceLang?: string
}

type SpeechRecognitionType = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionType) | null {
  if (typeof window === "undefined") return null
  const anyWindow = window as any
  return (anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition || null) as any
}

function parseVoiceNumber(rawText: string): number | null {
  const cleaned = rawText
    .toLowerCase()
    .replace(/[,₹$]/g, " ")
    .replace(/\b(rupees?|rs|inr|dollars?)\b/g, " ")
    .replace(/\bpercent\b/g, " % ")
    .replace(/\s+/g, " ")
    .trim()

  // Convert common "point" spoken decimal: "8 point 5" -> "8.5"
  const pointMatch = cleaned.match(/\b(\d+)\s+point\s+(\d+)\b/)
  const normalized = pointMatch ? cleaned.replace(pointMatch[0], `${pointMatch[1]}.${pointMatch[2]}`) : cleaned

  // Handle Indian units: lakh/lac, crore
  const unitMatch = normalized.match(/\b(\d+(?:\.\d+)?)\s*(lakh|lac|crore|thousand|million|billion)\b/)
  if (unitMatch) {
    const base = Number(unitMatch[1])
    if (!Number.isFinite(base)) return null

    const unit = unitMatch[2]
    const mult =
      unit === "lakh" || unit === "lac" ? 100000 :
      unit === "crore" ? 10000000 :
      unit === "thousand" ? 1000 :
      unit === "million" ? 1000000 :
      unit === "billion" ? 1000000000 :
      1

    return base * mult
  }

  // Fallback: first number in transcript
  const numMatch = normalized.match(/\b\d+(?:\.\d+)?\b/)
  if (!numMatch) return null
  const n = Number(numMatch[0])
  return Number.isFinite(n) ? n : null
}

export function InputGroup({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000000,
  step = 1,
  prefix,
  suffix,
  helpText,
  disabled,
  enableVoice = false,
  voiceLang = "en-IN"
}: InputGroupProps) {
  const { currency } = useSettings()
  const displayPrefix = prefix === "₹" ? currency.symbol : prefix
  const [localValue, setLocalValue] = useState(value.toLocaleString('en-IN'))
  const isInternalChange = useRef(false)

  const SpeechRecognitionCtor = useMemo(() => getSpeechRecognitionCtor(), [])
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (!isInternalChange.current && parseFloat(localValue.replace(/,/g, '')) !== value) {
      setLocalValue(value.toLocaleString('en-IN'))
    }
    isInternalChange.current = false
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const withoutCommas = e.target.value.replace(/,/g, '')
    let sanitized = withoutCommas.replace(/[^ -9.]/g, '')

    // Keep only one decimal point.
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = `${parts[0]}.${parts.slice(1).join('')}`
    }

    setLocalValue(sanitized)
    isInternalChange.current = true

    if (sanitized === '' || sanitized === '.') return

    const numValue = parseFloat(sanitized)
    if (!Number.isNaN(numValue) && Number.isFinite(numValue)) {
      onChange(numValue)
    }
  }

  const handleBlur = () => {
    const rawValue = localValue.replace(/,/g, '')
    const parsed = rawValue === '' ? NaN : parseFloat(rawValue)

    if (!Number.isFinite(parsed)) {
      setLocalValue(value.toLocaleString('en-IN'))
      return
    }

    const clamped = Math.min(max, Math.max(min, parsed))
    onChange(clamped)
    setLocalValue(clamped.toLocaleString('en-IN'))
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawValue = localValue.replace(/,/g, '')
    setLocalValue(rawValue)
    e.target.select()
  }

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        // ignore
      }
    }
  }, [])

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone permission request is not available (try Chrome/Edge)")
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch (err: any) {
      const name: string | undefined = err?.name
      if (name === "NotAllowedError" || name === "SecurityError") {
        toast.error("Microphone permission denied. Allow mic access and try again.")
      } else if (name === "NotFoundError") {
        toast.error("No microphone device found")
      } else {
        toast.error("Could not get microphone permission")
      }
      return false
    }
  }

  const startListening = async () => {
    if (!SpeechRecognitionCtor) {
      toast.error("Voice input is not supported in this browser")
      return
    }
    if (disabled) return

    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Voice input needs HTTPS (or localhost). Try https:// or run on localhost.")
      return
    }

    const allowed = await requestMicrophonePermission()
    if (!allowed) return

    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = voiceLang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript: string | undefined = event?.results?.[0]?.[0]?.transcript
      const parsed = transcript ? parseVoiceNumber(transcript) : null

      if (parsed == null) {
        toast.error(transcript ? `Could not understand number: "${transcript}"` : "Could not hear a value")
        return
      }

      const clamped = Math.min(max, Math.max(min, parsed))
      onChange(clamped)
      toast.success("Value filled from voice")
    }

    recognition.onerror = () => {
      toast.error("Voice input failed")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    setIsListening(true)

    try {
      recognition.start()
    } catch {
      setIsListening(false)
      toast.error("Could not start voice input")
    }
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }
    setIsListening(false)
  }

  return (
    <div className="space-y-4 p-5 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 bg-primary/30 rounded-full group-hover:bg-primary transition-colors"/>
          <label className="text-sm font-medium text-foreground/90">{label}</label>
        </div>
        <div className="flex items-center gap-2 bg-secondary/30 border border-transparent hover:border-primary/20 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 rounded-xl px-4 py-3 transition-all w-full sm:w-auto max-w-full">
          {displayPrefix && <span className="text-muted-foreground font-medium select-none text-lg">{displayPrefix}</span>}
          <input
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            className="w-[12ch] sm:w-[14ch] min-w-0 px-1 text-right font-bold bg-transparent outline-none text-xl sm:text-2xl text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
          />
          {suffix && <span className="text-muted-foreground font-medium select-none text-lg">{suffix}</span>}

          {enableVoice ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={isListening ? stopListening : startListening}
              disabled={disabled || !SpeechRecognitionCtor}
              aria-label={isListening ? `Stop voice input for ${label}` : `Start voice input for ${label}`}
              title={!SpeechRecognitionCtor ? "Voice not supported" : isListening ? "Stop voice" : "Speak value"}
              className="shrink-0"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
          <span>{displayPrefix}{min.toLocaleString('en-IN')}{suffix}</span>
          <span>{displayPrefix}{max.toLocaleString('en-IN')}{suffix}</span>
        </div>
      </div>
      
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1 pl-1 border-l-2 border-primary/20">{helpText}</p>
      )}
    </div>
  )
}

// Updated ResultCardProps
interface ResultCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  subtext?: string
  type?: "default" | "highlight" | "success" | "warning"
  icon?: LucideIcon
  prefix?: string
  suffix?: string
}

export function ResultCard({ label, value, subtext, type = "default", icon: Icon, prefix, suffix, className, ...props }: ResultCardProps) {
  const { currency } = useSettings()
  const displayPrefix = prefix === "₹" ? currency.symbol : prefix

  const styles = {
    default: "bg-card border-border/50 text-foreground hover:border-primary/20",
    highlight: "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10",
    success: "bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/10",
    warning: "bg-orange-500/5 border-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10"
  }

  const valueStr = value.toString()
  const isLong = valueStr.length > 12
  const isVeryLong = valueStr.length > 20

  const isCurrency = Boolean(prefix) && (prefix === '₹' || displayPrefix === currency.symbol)
  const numericValue = typeof value === 'number' ? value : null

  const formatCompactINR = (n: number) => {
    const abs = Math.abs(n)

    // Thousand Crore (KCr) for very large numbers to keep cards readable.
    if (abs >= 10_000_000_000) {
      const kcr = n / 10_000_000_000
      const kcrStr = kcr
        .toFixed(kcr >= 100 ? 0 : kcr >= 10 ? 1 : 2)
        .replace(/\.0+$/, '')
        .replace(/(\.[0-9]*?)0+$/, '$1')
      return `${displayPrefix ?? ''}${kcrStr}KCr`
    }

    // Crore (1,00,00,000)
    if (abs >= 10_000_000) {
      const cr = n / 10_000_000
      const crStr = cr.toFixed(cr >= 100 ? 0 : cr >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
      return `${displayPrefix ?? ''}${crStr}Cr`
    }
    // Lakh (1,00,000)
    if (abs >= 100_000) {
      const l = n / 100_000
      const lStr = l.toFixed(l >= 100 ? 0 : l >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
      return `${displayPrefix ?? ''}${lStr}L`
    }
    return `${displayPrefix ?? ''}${n.toLocaleString('en-IN')}`
  }

  const showCompact = Boolean(isCurrency && numericValue != null && Math.abs(numericValue) >= 100_000)
  const mainValueText = (() => {
    if (showCompact && numericValue != null) return `${formatCompactINR(numericValue)}${suffix ?? ''}`
    return `${displayPrefix ?? ''}${value}${suffix ?? ''}`
  })()

  const mainLen = mainValueText.length
  const compactIsVeryLong = showCompact && mainLen >= 10
  const compactIsLong = showCompact && mainLen >= 8

  const autoSubtext = (() => {
    if (subtext) return subtext
    if (!showCompact || numericValue == null) return undefined
    const full = `${displayPrefix ?? ''}${numericValue.toLocaleString('en-IN')}${suffix ?? ''}`
    return full
  })()

  return (
    <div className={cn(
      "p-4 sm:p-6 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 overflow-hidden",
      styles[type],
      className
    )} {...props}>
      {Icon && <Icon className="w-8 h-8 mb-1 opacity-80" />}
      <p className="text-sm font-medium opacity-70 uppercase tracking-wider">{label}</p>
      <p className={cn(
        "font-bold tracking-tight tabular-nums w-full px-2 leading-none",
        showCompact ? "whitespace-nowrap" : "break-words",
        compactIsVeryLong
          ? "text-lg sm:text-xl"
          : compactIsLong
            ? "text-xl sm:text-2xl"
            : isVeryLong
              ? "text-lg sm:text-xl"
              : isLong
                ? "text-2xl sm:text-3xl"
                : "text-3xl sm:text-4xl"
      )}>
        {mainValueText}
      </p>
      {autoSubtext && (
        <p className="text-xs opacity-70 font-medium bg-background/50 px-2 py-1 rounded-full tabular-nums whitespace-nowrap max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {autoSubtext}
        </p>
      )}
    </div>
  )
}

function GenericFinancialSeo({ title }: { title: string }) {
  const { language } = useSettings()
  const t = getMergedTranslations(language)

  const copy = (() => {
    const base = {
      heroTitle: `Mastering Your Finances with the ${title}`,
      heroBody:
        `In today's rapidly evolving financial landscape, making informed decisions is more crucial than ever. ` +
        `The ${title} helps you turn inputs into actionable insights so you can plan with confidence.`,
      accuracyTitle: 'Why Accuracy Matters in Financial Planning',
      accuracyP1:
        `Financial planning is about predicting outcomes based on variables like rate, time, and amount. ` +
        `Small changes can create big differences over time due to compounding.`,
      accuracyP2: 'Using a calculator reduces manual errors and helps you focus on decision-making.',
      effectiveTitle: 'How to Use This Calculator Effectively',
      effectiveIntro: `To get the most out of the ${title}, consider these tips:`,
      tip1Strong: 'Input Accurate Data:',
      tip1Body: 'Enter realistic values for rates, amounts, and time periods.',
      tip2Strong: 'Experiment with Scenarios:',
      tip2Body: 'Try “what-if” changes (rate/tenure/amount) and compare results.',
      tip3Strong: 'Review the Schedule:',
      tip3Body: 'If available, check yearly/monthly breakdowns to understand trends.',
      tip4Strong: 'Download and Share:',
      tip4Body: 'Save reports to compare options or discuss with others.',
      techTitle: 'The Role of Technology in Personal Finance',
      techBody:
        `Tools like this ${title} make complex calculations simpler and faster. Charts and tables help you understand numbers at a glance.`,
      privacyTitle: 'Data Privacy and Security',
      privacyBody:
        `We follow a privacy-first approach. Most calculations happen in your browser, and we do not store your personal inputs.`,
      conceptsTitle: 'Understanding Key Financial Concepts',
      conceptsIntro: 'Understanding these concepts can improve your decisions:',
      compoundingStrong: 'Compounding:',
      compoundingBody: 'Returns can earn returns over time; the effect grows with longer durations.',
      inflationStrong: 'Inflation:',
      inflationBody: 'Money loses purchasing power over time; consider real (inflation-adjusted) outcomes.',
      riskStrong: 'Risk vs. Reward:',
      riskBody: 'Higher returns often come with higher risk; evaluate both.',
      disclaimerTitle: 'Disclaimer',
      disclaimerBody:
        `Results from this ${title} are for informational purposes only and are not financial advice. ` +
        `Actual outcomes may vary. Consider consulting a qualified advisor for major decisions.`,
      faqTitle: 'Frequently Asked Questions (FAQ)',
      faqQ1: `How accurate is this ${title}?`,
      faqA1:
        `It uses standard financial formulas. Minor differences may occur due to rounding or lender-specific policies, but it is suitable for planning.`,
      faqQ2: 'Is my financial data safe?',
      faqA2: 'Yes. Calculations run on your browser (client-side). We do not store your inputs.',
      faqQ3: 'Can I download the calculation results?',
      faqA3: 'Yes. Use the Download button to export to formats like PDF/Excel/CSV (when available).',
      faqQ4: `Is this ${title} free to use?`,
      faqA4: 'Yes. It is free to use with no hidden fees.',
      crumbsHome: t?.nav?.home || 'Home',
      crumbsCalcs: t?.nav?.allCalculators || 'Calculators',
    }

    if (language === 'hi') {
      return {
        ...base,
        heroTitle: `अपने वित्त पर पकड़: ${title}`,
        heroBody:
          `आज के तेज़ी से बदलते वित्तीय माहौल में सही निर्णय लेना पहले से भी ज़्यादा ज़रूरी है। ` +
          `${title} आपको इनपुट से उपयोगी इनसाइट्स तक तेज़ी से पहुँचाता है ताकि आप बेहतर योजना बना सकें।`,
        accuracyTitle: 'वित्तीय योजना में सटीकता क्यों ज़रूरी है',
        accuracyP1:
          `वित्तीय योजना भविष्य के परिणाम का अनुमान है। ब्याज दर, अवधि या राशि में छोटा बदलाव भी समय के साथ बड़ा अंतर पैदा कर सकता है।`,
        accuracyP2: 'यह टूल मैन्युअल गलतियों से बचाता है और निर्णय लेना आसान बनाता है।',
        effectiveTitle: 'इस कैलकुलेटर को बेहतर तरीके से कैसे उपयोग करें',
        effectiveIntro: 'बेहतर आउटपुट के लिए ये टिप्स देखें:',
        tip1Strong: 'सही डेटा भरें:',
        tip1Body: 'दर, राशि और अवधि जैसी वैल्यू यथार्थ रूप से भरें।',
        tip2Strong: 'अलग-अलग परिदृश्य देखें:',
        tip2Body: '“क्या हो अगर” बदलाव करके विकल्पों की तुलना करें।',
        tip3Strong: 'शेड्यूल/टेबल देखें:',
        tip3Body: 'यदि उपलब्ध हो, तो मासिक/वार्षिक ब्रेकडाउन देखें।',
        tip4Strong: 'डाउनलोड/शेयर करें:',
        tip4Body: 'रिपोर्ट सेव करके अलग-अलग विकल्पों की तुलना करें।',
        techTitle: 'पर्सनल फाइनेंस में टेक्नोलॉजी की भूमिका',
        techBody: `${title} जैसे टूल्स जटिल गणनाओं को आसान बनाते हैं और चार्ट/टेबल से समझ बढ़ाते हैं।`,
        privacyTitle: 'डेटा प्राइवेसी और सुरक्षा',
        privacyBody:
          `हम privacy-first अप्रोच अपनाते हैं। ज्यादातर कैलकुलेशन आपके ब्राउज़र में होते हैं और हम आपके इनपुट स्टोर नहीं करते।`,
        conceptsTitle: 'मुख्य वित्तीय अवधारणाएँ',
        conceptsIntro: 'इन अवधारणाओं को समझने से निर्णय बेहतर हो सकते हैं:',
        compoundingStrong: 'कंपाउंडिंग:',
        compoundingBody: 'रिटर्न पर भी रिटर्न मिलता है; समय बढ़ने पर प्रभाव बढ़ता है।',
        inflationStrong: 'महँगाई (Inflation):',
        inflationBody: 'समय के साथ क्रय-शक्ति घटती है; रियल परिणाम पर ध्यान दें।',
        riskStrong: 'जोखिम बनाम रिटर्न:',
        riskBody: 'अधिक रिटर्न के साथ अक्सर अधिक जोखिम आता है।',
        disclaimerTitle: 'अस्वीकरण (Disclaimer)',
        disclaimerBody:
          `इस ${title} के परिणाम केवल जानकारी के लिए हैं और वित्तीय सलाह नहीं हैं। वास्तविक परिणाम अलग हो सकते हैं।`,
        faqTitle: 'अक्सर पूछे जाने वाले सवाल (FAQ)',
        faqQ1: `यह ${title} कितना सटीक है?`,
        faqA1: 'यह मानक वित्तीय फ़ॉर्मूलों पर आधारित है। राउंडिंग/नीतियों के कारण थोड़ा अंतर हो सकता है, लेकिन योजना के लिए उपयोगी है।',
        faqQ2: 'क्या मेरा वित्तीय डेटा सुरक्षित है?',
        faqA2: 'हाँ। यह टूल आपके ब्राउज़र में चलता है और हम आपके इनपुट स्टोर नहीं करते।',
        faqQ3: 'क्या मैं परिणाम डाउनलोड कर सकता/सकती हूँ?',
        faqA3: 'हाँ। उपलब्ध होने पर Download बटन से PDF/Excel/CSV में एक्सपोर्ट करें।',
        faqQ4: `क्या ${title} मुफ़्त है?`,
        faqA4: 'हाँ। यह पूरी तरह मुफ़्त है।',
        crumbsHome: t?.nav?.home || 'होम',
        crumbsCalcs: t?.nav?.allCalculators || 'कैलकुलेटर',
      }
    }

    if (language === 'ta') {
      return {
        ...base,
        heroTitle: `${title} மூலம் உங்கள் நிதியை நிர்வகிக்கவும்`,
        heroBody:
          `இன்றைய நிதி சூழலில் சரியான முடிவுகள் மிக முக்கியம். ` +
          `${title} உங்கள் உள்ளீடுகளை தெளிவான முடிவுகளாக மாற்றி திட்டமிட உதவுகிறது.`,
        accuracyTitle: 'நிதித் திட்டமிடலில் துல்லியம் ஏன் முக்கியம்',
        effectiveTitle: 'இந்த கால்குலேட்டரை சிறப்பாக பயன்படுத்துவது எப்படி',
        techTitle: 'தனிநபர் நிதியில் தொழில்நுட்பத்தின் பங்கு',
        privacyTitle: 'தனியுரிமை & பாதுகாப்பு',
        conceptsTitle: 'முக்கிய நிதி கருத்துகள்',
        disclaimerTitle: 'அறிவிப்பு (Disclaimer)',
        faqTitle: 'அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQ)',
        tip1Strong: 'துல்லியமான தரவு:',
        tip2Strong: 'விதவிதமான நிலைகளை முயற்சி செய்யுங்கள்:',
        tip3Strong: 'அட்டவணை/பிரிவு விவரத்தைப் பார்க்கவும்:',
        tip4Strong: 'பதிவிறக்கு/பகிர்:',
        faqQ2: 'என் நிதித் தரவு பாதுகாப்பாக உள்ளதா?',
        faqQ3: 'முடிவுகளை பதிவிறக்க முடியுமா?',
        crumbsHome: t?.nav?.home || 'முகப்பு',
        crumbsCalcs: t?.nav?.allCalculators || 'கால்குலேட்டர்கள்',
      }
    }

    if (language === 'te') {
      return {
        ...base,
        heroTitle: `${title} తో మీ ఆర్థిక వ్యవస్థను మెరుగుపరచండి`,
        heroBody:
          `ఈరోజు ఆర్థిక నిర్ణయాలు మరింత ముఖ్యమయ్యాయి. ` +
          `${title} ఇన్‌పుట్‌లను స్పష్టమైన ఫలితాలుగా మార్చి ప్లాన్ చేయడంలో సహాయపడుతుంది.`,
        accuracyTitle: 'ఆర్థిక ప్రణాళికలో ఖచ్చితత్వం ఎందుకు ముఖ్యం',
        effectiveTitle: 'ఈ కాలిక్యులేటర్‌ను సమర్థవంతంగా ఎలా ఉపయోగించాలి',
        techTitle: 'వ్యక్తిగత ఆర్థికాల్లో టెక్నాలజీ పాత్ర',
        privacyTitle: 'డేటా ప్రైవసీ & సెక్యూరిటీ',
        conceptsTitle: 'ముఖ్య ఆర్థిక కాన్సెప్ట్‌లు',
        disclaimerTitle: 'డిస్క్లైమర్',
        faqTitle: 'తరచుగా అడిగే ప్రశ్నలు (FAQ)',
        tip1Strong: 'ఖచ్చితమైన డేటా:',
        tip2Strong: 'స్కెనారియోలను ప్రయత్నించండి:',
        tip3Strong: 'షెడ్యూల్ చూడండి:',
        tip4Strong: 'డౌన్‌లోడ్/షేర్:',
        faqQ2: 'నా ఆర్థిక డేటా సేఫా?',
        faqQ3: 'ఫలితాలను డౌన్‌లోడ్ చేయగలనా?',
        crumbsHome: t?.nav?.home || 'హోమ్',
        crumbsCalcs: t?.nav?.allCalculators || 'కాలిక్యులేటర్లు',
      }
    }

    if (language === 'bn') {
      return {
        ...base,
        heroTitle: `${title} দিয়ে আপনার অর্থনীতি নিয়ন্ত্রণে রাখুন`,
        heroBody:
          `আজকের আর্থিক বাস্তবতায় সঠিক সিদ্ধান্ত নেওয়া গুরুত্বপূর্ণ। ` +
          `${title} আপনার ইনপুটকে স্পষ্ট ফলাফলে রূপান্তর করে পরিকল্পনায় সাহায্য করে।`,
        accuracyTitle: 'আর্থিক পরিকল্পনায় নির্ভুলতা কেন গুরুত্বপূর্ণ',
        effectiveTitle: 'এই ক্যালকুলেটরটি কার্যকরভাবে কীভাবে ব্যবহার করবেন',
        techTitle: 'ব্যক্তিগত অর্থে প্রযুক্তির ভূমিকা',
        privacyTitle: 'ডেটা গোপনীয়তা ও নিরাপত্তা',
        conceptsTitle: 'মূল আর্থিক ধারণা',
        disclaimerTitle: 'ডিসক্লেইমার',
        faqTitle: 'প্রায়শই জিজ্ঞাসিত প্রশ্ন (FAQ)',
        tip1Strong: 'সঠিক ডেটা দিন:',
        tip2Strong: 'বিভিন্ন পরিস্থিতি পরীক্ষা করুন:',
        tip3Strong: 'ব্রেকডাউন/শিডিউল দেখুন:',
        tip4Strong: 'ডাউনলোড/শেয়ার:',
        faqQ2: 'আমার আর্থিক ডেটা কি নিরাপদ?',
        faqQ3: 'আমি কি ফলাফল ডাউনলোড করতে পারব?',
        crumbsHome: t?.nav?.home || 'হোম',
        crumbsCalcs: t?.nav?.allCalculators || 'ক্যালকুলেটর',
      }
    }

    if (language === 'mr') {
      return {
        ...base,
        heroTitle: `${title} सह तुमचे वित्त अधिक चांगले व्यवस्थापित करा`,
        heroBody:
          `आजच्या आर्थिक वातावरणात योग्य निर्णय महत्त्वाचे आहेत. ` +
          `${title} तुमचे इनपुट स्पष्ट निकालांमध्ये रूपांतरित करून योजना करण्यात मदत करते.`,
        accuracyTitle: 'वित्तीय नियोजनात अचूकता का महत्त्वाची आहे',
        effectiveTitle: 'हा कॅल्क्युलेटर प्रभावीपणे कसा वापरावा',
        techTitle: 'पर्सनल फायनान्समध्ये टेक्नॉलॉजीची भूमिका',
        privacyTitle: 'डेटा प्रायव्हसी आणि सुरक्षा',
        conceptsTitle: 'मुख्य वित्तीय संकल्पना',
        disclaimerTitle: 'अस्वीकरण',
        faqTitle: 'नेहमी विचारले जाणारे प्रश्न (FAQ)',
        tip1Strong: 'अचूक डेटा:',
        tip2Strong: 'परिदृश्ये तपासा:',
        tip3Strong: 'शेड्यूल/ब्रेकडाउन पहा:',
        tip4Strong: 'डाउनलोड/शेअर:',
        faqQ2: 'माझा वित्तीय डेटा सुरक्षित आहे का?',
        faqQ3: 'मी निकाल डाउनलोड करू शकतो का?',
        crumbsHome: t?.nav?.home || 'होम',
        crumbsCalcs: t?.nav?.allCalculators || 'कॅल्क्युलेटर',
      }
    }

    if (language === 'gu') {
      return {
        ...base,
        heroTitle: `${title} સાથે તમારા નાણાં નિયંત્રણમાં રાખો`,
        heroBody:
          `આજના નાણાકીય વાતાવરણમાં સમજદારીપૂર્વક નિર્ણયો લેવું મહત્વનું છે. ` +
          `${title} તમારા ઇનપુટ્સને સ્પષ્ટ પરિણામોમાં બદલી યોજના બનાવવા મદદ કરે છે.`,
        accuracyTitle: 'નાણાકીય આયોજનમાં ચોકસાઈ કેમ જરૂરી છે',
        effectiveTitle: 'આ કેલ્ક્યુલેટર અસરકારક રીતે કેવી રીતે વાપરવું',
        techTitle: 'પર્સનલ ફાઇનાન્સમાં ટેકનોલોજીની ભૂમિકા',
        privacyTitle: 'ડેટા પ્રાઇવસી અને સુરક્ષા',
        conceptsTitle: 'મુખ્ય નાણાકીય ખ્યાલો',
        disclaimerTitle: 'ડિસ્ક્લેમર',
        faqTitle: 'વારંવાર પૂછાતા પ્રશ્નો (FAQ)',
        tip1Strong: 'ચોક્કસ ડેટા:',
        tip2Strong: 'સ્કેનારિયો અજમાવો:',
        tip3Strong: 'શેડ્યૂલ/બ્રેકડાઉન જુઓ:',
        tip4Strong: 'ડાઉનલોડ/શેર:',
        faqQ2: 'મારો નાણાકીય ડેટા સુરક્ષિત છે?',
        faqQ3: 'શું હું પરિણામ ડાઉનલોડ કરી શકું?',
        crumbsHome: t?.nav?.home || 'હોમ',
        crumbsCalcs: t?.nav?.allCalculators || 'કેલ્ક્યુલેટર્સ',
      }
    }

    return base
  })()

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-li:text-muted-foreground">
      <div className="p-8 bg-secondary/5 rounded-3xl border border-border/50 my-12">
        <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          {copy.heroTitle}
        </h2>
        <p className="lead text-lg">{copy.heroBody}</p>
      </div>

      <h3>{copy.accuracyTitle}</h3>
      <p>{copy.accuracyP1}</p>
      <p>{copy.accuracyP2}</p>

      <h3>{copy.effectiveTitle}</h3>
      <p>{copy.effectiveIntro}</p>
      <ul>
        <li>
          <strong>{copy.tip1Strong}</strong>{' '}
          {copy.tip1Body}
        </li>
        <li>
          <strong>{copy.tip2Strong}</strong>{' '}
          {copy.tip2Body}
        </li>
        <li>
          <strong>{copy.tip3Strong}</strong>{' '}
          {copy.tip3Body}
        </li>
        <li>
          <strong>{copy.tip4Strong}</strong>{' '}
          {copy.tip4Body}
        </li>
      </ul>

      <h3>{copy.techTitle}</h3>
      <p>{copy.techBody}</p>

      <h3>{copy.privacyTitle}</h3>
      <p>{copy.privacyBody}</p>

      <h3>{copy.conceptsTitle}</h3>
      <p>{copy.conceptsIntro}</p>
      <ul>
        <li>
          <strong>{copy.compoundingStrong}</strong>{' '}
          {copy.compoundingBody}
        </li>
        <li>
          <strong>{copy.inflationStrong}</strong>{' '}
          {copy.inflationBody}
        </li>
        <li>
          <strong>{copy.riskStrong}</strong>{' '}
          {copy.riskBody}
        </li>
      </ul>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 mt-8">
        <h4 className="text-blue-800 dark:text-blue-300 font-semibold mb-2">
          {copy.disclaimerTitle}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 m-0">
          {copy.disclaimerBody}
        </p>
      </div>

      <div className="mt-12 border-t border-border/50 pt-10">
        <h3 className="text-2xl font-bold mb-6">{copy.faqTitle}</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              {copy.faqQ1}
            </h4>
            <p>
              {copy.faqA1}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              {copy.faqQ2}
            </h4>
            <p>
              {copy.faqA2}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              {copy.faqQ3}
            </h4>
            <p>
              {copy.faqA3}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              {copy.faqQ4}
            </h4>
            <p>
              {copy.faqA4}
            </p>
          </div>
        </div>
      </div>
      
      {/* Schema Markup for SEO */}
      <BreadcrumbSchema 
          items={[
            { name: copy.crumbsHome, url: "https://calculatorloop.com" },
            { name: copy.crumbsCalcs, url: "https://calculatorloop.com" },
            { name: title, url: `https://calculatorloop.com` }
          ]}
        />
    </article>
  )
}


