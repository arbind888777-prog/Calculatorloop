"use client"

import { ReactNode, useState, useEffect, useMemo, useRef } from "react"
import { 
  Activity, LucideIcon, Download, Printer, Share2,
  FileText, FileSpreadsheet, FileJson, FileCode, FileImage, FileType,
  Database, FileArchive, Presentation, TrendingUp,
  Heart, Scale, AlertCircle, CheckCircle, Info, Copy, History, Trash2,
  Zap, ZapOff, Settings, Image, Code,
  RefreshCw, Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { localizeToolMeta } from "@/lib/toolLocalization"
import { generateReport } from "@/lib/downloadUtils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomDownloadModal } from "@/components/CustomDownloadModal"

export interface HealthMetric {
  label: string
  value: string | number
  unit?: string
  status?: 'normal' | 'warning' | 'danger' | 'good'
  description?: string
  icon?: LucideIcon
}

export interface HealthRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
}

export interface HealthResult {
  primaryMetric?: HealthMetric
  metrics?: HealthMetric[]
  recommendations?: HealthRecommendation[]
  chartData?: any[]
  detailedBreakdown?: Record<string, any>
  riskFactors?: string[]
  healthScore?: number
}

interface ComprehensiveHealthTemplateProps {
  title: string
  description: string
  icon?: LucideIcon
  inputs: ReactNode
  result: HealthResult | null
  calculate: () => void
  calculateLabel?: string
  onClear?: () => void
  values?: any[]
  seoContent?: ReactNode
  categoryName?: string
  toolId?: string
  resultExtras?: ReactNode
}

export function ComprehensiveHealthTemplate({
  title,
  description,
  icon: Icon = Activity,
  inputs,
  result,
  calculate,
  calculateLabel = "Calculate",
  onClear,
  values = [],
  seoContent,
  categoryName = "Health",
  toolId = "health-calculator",
  resultExtras
}: ComprehensiveHealthTemplateProps) {
  const { language } = useSettings()
  const t = useMemo(() => getMergedTranslations(language), [language])

  const { title: displayTitle, description: displayDescription } = useMemo(
    () =>
      localizeToolMeta({
        dict: t,
        toolId,
        fallbackTitle: title,
        fallbackDescription: description,
      }),
    [t, toolId, title, description]
  )
  
  const [isAutoCalculate, setIsAutoCalculate] = useState(false)
  const [downloadMode, setDownloadMode] = useState<'choose' | 'auto' | 'custom'>('choose')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customModalFormat, setCustomModalFormat] = useState('pdf')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<Array<{ at: string; values: any[]; primary?: string; score?: number }>>([])
  const lastHistoryHashRef = useRef<string | null>(null)
  useEffect(() => {
    if (isAutoCalculate && values.length > 0) {
      calculate()
    }
  }, [isAutoCalculate, JSON.stringify(values)])

  const historyStorageKey = toolId ? `calculatorHistory:${toolId}` : null

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
    if (!result) return

    let hash = ""
    try {
      hash = JSON.stringify(values)
    } catch {
      return
    }
    if (!hash) return
    if (lastHistoryHashRef.current === hash) return
    lastHistoryHashRef.current = hash

    const primary = result.primaryMetric ? `${result.primaryMetric.label}: ${result.primaryMetric.value}${result.primaryMetric.unit ? ' ' + result.primaryMetric.unit : ''}` : undefined
    const score = result.healthScore

    try {
      const raw = localStorage.getItem(historyStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      const existing: Array<{ at: string; values: any[]; primary?: string; score?: number }> = Array.isArray(parsed) ? parsed : []
      const next = [{ at: new Date().toISOString(), values, primary, score }, ...existing].slice(0, 10)
      localStorage.setItem(historyStorageKey, JSON.stringify(next))
      setHistoryItems(next)
    } catch {
      // ignore
    }
  }, [historyStorageKey, result, JSON.stringify(values)])

  const clearHistory = () => {
    if (!historyStorageKey) return
    try {
      localStorage.removeItem(historyStorageKey)
    } catch {
      // ignore
    }
    setHistoryItems([])
  }

  const copyHistoryItem = async (item: { at: string; values: any[]; primary?: string; score?: number }) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ toolId, title, at: item.at, values: item.values, primary: item.primary, score: item.score }, null, 2))
      toast.success("Inputs copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleDownload = async (format: string) => {
    if (!result) {
      toast.error("Please calculate first before downloading")
      return
    }

    try {
      const headers = ["Metric", "Value", "Status"]
      const data: (string | number)[][] = []

      // Add primary metric if available
      if (result.primaryMetric) {
        data.push([
          result.primaryMetric.label,
          `${result.primaryMetric.value}${result.primaryMetric.unit ? ' ' + result.primaryMetric.unit : ''}`,
          result.primaryMetric.status || 'N/A'
        ])
      }

      // Add all metrics if available
      if (result.metrics) {
        result.metrics.forEach(metric => {
          data.push([
            metric.label,
            `${metric.value}${metric.unit ? ' ' + metric.unit : ''}`,
            metric.status || 'N/A'
          ])
        })
      }

      // Add detailed breakdown if available
      if (result.detailedBreakdown) {
        Object.entries(result.detailedBreakdown).forEach(([key, value]) => {
          data.push([key, String(value), 'Info'])
        })
      }

      // Add recommendations if available
      if (result.recommendations) {
        data.push(['--- Recommendations ---', '', ''])
        result.recommendations.forEach((rec, idx) => {
          data.push([
            `${idx + 1}. ${rec.title}`,
            rec.description,
            rec.priority.toUpperCase()
          ])
        })
      }

      // Add risk factors if available
      if (result.riskFactors && result.riskFactors.length > 0) {
        data.push(['--- Risk Factors ---', '', ''])
        result.riskFactors.forEach((risk, idx) => {
          data.push([`${idx + 1}`, risk, 'Warning'])
        })
      }

      // Add health score if available
      if (result.healthScore !== undefined) {
        data.push(['Overall Health Score', `${result.healthScore}/100`, 'Score'])
      }

      const metadata: Record<string, any> = {
        'Report Title': title,
        'Category': categoryName,
        'Generated On': new Date().toLocaleString(),
        'Calculator': toolId
      }

      if (result.primaryMetric) {
        metadata['Primary Result'] = `${result.primaryMetric.label}: ${result.primaryMetric.value}${result.primaryMetric.unit ? ' ' + result.primaryMetric.unit : ''}`
      }

      await generateReport(
        format,
        `${toolId}_health_report`,
        headers,
        data,
        title,
        metadata
      )
      
      setDownloadMode('choose')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to generate report')
    }
  }

  const clickFormat = (format: string) => {
    if (downloadMode === 'custom') {
      setCustomModalFormat(format)
      setShowCustomModal(true)
    } else {
      initiateDownload(format)
    }
  }

  const initiateDownload = (format: string) => {
    if (!result) {
      toast.error("Please calculate first before downloading")
      return
    }
    toast.promise(
      handleDownload(format),
      { loading: 'Generating report…', success: 'Downloaded!', error: 'Failed to generate report' }
    )
  }

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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'good':
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
      case 'normal':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      case 'danger':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": displayTitle,
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": displayDescription ?? description,
    "featureList": "Health metrics calculation, Multiple export formats, Health recommendations, Risk assessment",
    "browserRequirements": "Requires JavaScript"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background py-6 md:py-12 px-4 print:py-0 print:bg-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div id="calculator-content" className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10 animate-fadeIn print:hidden">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6 shadow-sm">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{categoryName} Calculator</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {displayTitle}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
            {displayDescription ?? description}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-2 rounded-2xl bg-secondary/10 border border-border/50 print:hidden">

          {/* Left: Auto Calculate Toggle */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-lg transition-colors", isAutoCalculate ? "bg-yellow-500/10 text-yellow-600" : "bg-muted text-muted-foreground")}>
                {isAutoCalculate ? <Zap className="h-4 w-4 fill-current" /> : <ZapOff className="h-4 w-4" />}
              </div>
              <Label htmlFor="health-auto-calculate" className="text-sm font-medium cursor-pointer select-none">
                Auto Calculate
              </Label>
            </div>
            <Switch
              id="health-auto-calculate"
              checked={isAutoCalculate}
              onCheckedChange={setIsAutoCalculate}
              className="data-[state=checked]:bg-yellow-500 ml-2"
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2">
            {onClear && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                title="Clear inputs"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onClear && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-10 w-10 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-600/10 rounded-xl transition-colors"
                title="Reset"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

            {toolId && (
              <DropdownMenu open={historyOpen} onOpenChange={setHistoryOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" title="History">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] p-3">
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-bold">Recent Calculations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {historyItems.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">No history yet. Run a calculation to save.</div>
                  ) : (
                    <div className="max-h-[320px] overflow-y-auto">
                      {historyItems.map((item, idx) => (
                        <DropdownMenuItem key={`${item.at}-${idx}`} className="rounded-lg cursor-pointer flex items-center justify-between gap-3" onClick={() => copyHistoryItem(item)}>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{new Date(item.at).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground truncate">{item.primary ?? 'Click to copy'}</div>
                          </div>
                          <Copy className="h-4 w-4" />
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive flex items-center gap-2" onClick={clearHistory} disabled={historyItems.length === 0}>
                    <Trash2 className="h-4 w-4" /><span>Clear history</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" title="Print">
              <Printer className="h-4 w-4" />
            </Button>

            {result && (
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
                    <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary shadow-sm rounded-xl px-4 h-10" onClick={() => setDownloadMode('choose')}>
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(480px,calc(100vw-1rem))] p-3 sm:p-4 max-h-[85vh] overflow-y-auto">

                    {/* Step 1: Choose mode */}
                    {downloadMode === 'choose' && (
                      <div className="space-y-3">
                        <DropdownMenuLabel className="px-1 py-1 text-base font-bold">How would you like to download?</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <button onClick={() => setDownloadMode('auto')} className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/20">
                            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-200">Auto Download</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Pick a format and download instantly — no extra steps.</p>
                          </div>
                        </button>
                        <button onClick={() => setDownloadMode('custom')} className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
                            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Custom Download</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Choose colours, font size, row range, watermark and more.</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Step 2: Format list */}
                    {(downloadMode === 'auto' || downloadMode === 'custom') && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <button onClick={() => setDownloadMode('choose')} className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Back">←</button>
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", downloadMode === 'auto' ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300")}>
                            {downloadMode === 'auto' ? <><Zap className="h-3 w-3" /> Auto — click to download</> : <><Settings className="h-3 w-3" /> Custom — click to customise</>}
                          </span>
                        </div>
                        <DropdownMenuSeparator className="mb-3" />
                        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-x-4 gap-y-2">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Basic &amp; Standard</div>
                              <DropdownMenuItem onClick={() => clickFormat('csv')} className="rounded-lg cursor-pointer"><FileText className="mr-2 h-4 w-4 text-green-600" /><span>CSV</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('excel')} className="rounded-lg cursor-pointer"><FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /><span>Excel (.xlsx)</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('pdf')} className="rounded-lg cursor-pointer"><FileType className="mr-2 h-4 w-4 text-red-500" /><span>PDF Document</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('json')} className="rounded-lg cursor-pointer"><FileJson className="mr-2 h-4 w-4 text-yellow-500" /><span>JSON Data</span></DropdownMenuItem>
                            </div>
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Images</div>
                              <DropdownMenuItem onClick={() => clickFormat('png')} className="rounded-lg cursor-pointer"><Image className="mr-2 h-4 w-4 text-purple-500" /><span>PNG Image</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('jpg')} className="rounded-lg cursor-pointer"><FileImage className="mr-2 h-4 w-4 text-orange-500" /><span>JPG Image</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('svg')} className="rounded-lg cursor-pointer"><Code className="mr-2 h-4 w-4 text-pink-500" /><span>SVG Vector</span></DropdownMenuItem>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Advanced Docs</div>
                              <DropdownMenuItem onClick={() => clickFormat('html')} className="rounded-lg cursor-pointer"><Code className="mr-2 h-4 w-4 text-orange-600" /><span>HTML Report</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('docx')} className="rounded-lg cursor-pointer"><FileText className="mr-2 h-4 w-4 text-blue-700" /><span>Word (.docx)</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('pptx')} className="rounded-lg cursor-pointer"><Presentation className="mr-2 h-4 w-4 text-orange-700" /><span>PowerPoint</span></DropdownMenuItem>
                            </div>
                            <div className="space-y-1">
                              <div className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Developer</div>
                              <DropdownMenuItem onClick={() => clickFormat('xml')} className="rounded-lg cursor-pointer"><FileCode className="mr-2 h-4 w-4 text-gray-500" /><span>XML Data</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('api')} className="rounded-lg cursor-pointer"><LinkIcon className="mr-2 h-4 w-4 text-indigo-500" /><span>API Link</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('sql')} className="rounded-lg cursor-pointer"><Database className="mr-2 h-4 w-4 text-blue-400" /><span>SQL Insert</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('zip')} className="rounded-lg cursor-pointer"><FileArchive className="mr-2 h-4 w-4 text-gray-600" /><span>ZIP Bundle</span></DropdownMenuItem>
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 mb-8">
          {/* Input Section - 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Input Parameters
                </CardTitle>
                <CardDescription>Enter your details below</CardDescription>
              </CardHeader>
              <CardContent>
                {inputs}

                {!isAutoCalculate && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={calculate}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      size="lg"
                    >
                      <Activity className="h-5 w-5 mr-2" />
                      {calculateLabel}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions for Mobile */}
            <div className="lg:hidden grid grid-cols-2 gap-2">
               <Button variant="outline" onClick={() => initiateDownload('pdf')} className="w-full">
                  <FileText className="h-4 w-4 mr-2" /> PDF
               </Button>
               <Button variant="outline" onClick={handleShare} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" /> Share
               </Button>
            </div>
          </div>

          {/* Results Section - 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            {result ? (
              <>
                {/* Primary Result Card */}
                <div className="grid md:grid-cols-2 gap-4">
                  {result.primaryMetric && (
                    <Card className={cn(
                      "border-2 shadow-lg hover:shadow-xl transition-all duration-300",
                      getStatusColor(result.primaryMetric.status)
                    )}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {result.primaryMetric.label}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold">
                                {result.primaryMetric.value}
                              </span>
                              {result.primaryMetric.unit && (
                                <span className="text-xl text-muted-foreground">
                                  {result.primaryMetric.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusIcon(result.primaryMetric.status)}
                        </div>
                        {result.primaryMetric.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {result.primaryMetric.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Health Score Card */}
                  {result.healthScore !== undefined && (
                    <Card className="border-border shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Heart className="h-5 w-5 text-primary" />
                            Health Score
                          </h3>
                          <span className="text-2xl font-bold text-primary">
                            {result.healthScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 mb-2">
                          <div
                            className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${result.healthScore}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Based on your inputs and standard health guidelines.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Detailed Sections (no Tabs dependency) */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Detailed Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                      {result.metrics?.map((metric, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            getStatusColor(metric.status)
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {metric.icon && <metric.icon className="h-4 w-4" />}
                            <span className="text-sm font-medium">{metric.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {metric.value}
                              {metric.unit && ` ${metric.unit}`}
                            </span>
                            {getStatusIcon(metric.status)}
                          </div>
                        </div>
                      ))}
                      {(!result.metrics || result.metrics.length === 0) && (
                        <p className="text-muted-foreground">No metrics available.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        Personalized Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.recommendations?.map((rec, idx) => (
                        <div
                          key={idx}
                          className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{rec.title}</h3>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              getPriorityColor(rec.priority)
                            )}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <span className="text-xs text-muted-foreground italic">{rec.category}</span>
                        </div>
                      ))}
                      {(!result.recommendations || result.recommendations.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">No specific recommendations available.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-red-100 dark:border-red-900/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.riskFactors?.map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                        {(!result.riskFactors || result.riskFactors.length === 0) && (
                          <li className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>No significant risk factors identified based on provided data.</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {resultExtras}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-2xl p-12 text-center min-h-[400px]">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Activity className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready to Calculate</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Enter your parameters in the input section and click calculate to see your detailed health analysis, recommendations, and download options.
                </p>
                <Button onClick={calculate} variant="outline">
                  Calculate Now
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* SEO Content */}
        {seoContent && (
          <div className="mt-12 prose dark:prose-invert max-w-none bg-card p-8 rounded-2xl border border-border shadow-sm">
            {seoContent}
          </div>
        )}
      </div>

      {/* Custom Download Modal */}
      <CustomDownloadModal
        open={showCustomModal}
        onClose={() => { setShowCustomModal(false); setDownloadMode('choose') }}
        data={{
          ...(result?.detailedBreakdown || {}),
          primaryResult: result?.primaryMetric
            ? `${result.primaryMetric.label}: ${result.primaryMetric.value}${result.primaryMetric.unit ? ' ' + result.primaryMetric.unit : ''}`
            : '',
          healthScore: result?.healthScore !== undefined ? `${result.healthScore}/100` : '',
          schedule: []
        }}
        title={title}
        format={customModalFormat}
      />
    </div>
  )
}
