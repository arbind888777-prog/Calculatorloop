"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight, Calculator, TrendingUp } from "lucide-react"
import { toolsData } from "@/lib/toolsData"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VoiceInput } from "@/components/ui/voice-input"
import { useSettings } from "@/components/providers/SettingsProvider"
import { getMergedTranslations } from "@/lib/translations"
import { localizeToolMeta } from "@/lib/toolLocalization"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  url: string
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { language } = useSettings()
  const dict = useMemo(() => getMergedTranslations(language), [language])

  const prefix = language && language !== 'en' ? `/${language}` : ''

  const withLocale = (href: string) => {
    if (!href) return href
    if (href.startsWith('http://') || href.startsWith('https://')) return href
    if (href.startsWith('#')) return `${prefix}/${href}`
    if (!href.startsWith('/')) return href
    if (!prefix) return href
    if (href === '/') return prefix
    return `${prefix}${href}`
  }

  // Flatten tools data for searching (localized)
  const allTools = useMemo(() => {
    return Object.entries(toolsData).flatMap(([categoryKey, categoryData]) =>
      Object.values(categoryData.subcategories).flatMap((subcategory) =>
        subcategory.calculators
          .map((tool) => {
          const meta = localizeToolMeta({
            dict,
            toolId: tool.id,
            fallbackTitle: tool.title,
            fallbackDescription: tool.description,
          })

          // Always use clean, canonical URLs (no legacy .html paths)
          const rawUrl = `/calculator/${tool.id}`

          return {
            id: tool.id,
            title: meta.title,
            description: meta.description || "",
            category: categoryKey,
            url: withLocale(rawUrl),
          }
        })
      )
    )
  }, [dict, language])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTerms = query.toLowerCase().split(" ")
    const filtered = allTools.filter(tool => {
      const titleMatch = searchTerms.every(term => tool.title.toLowerCase().includes(term))
      const descMatch = searchTerms.every(term => tool.description.toLowerCase().includes(term))
      return titleMatch || descMatch
    }).slice(0, 10) // Limit to 10 results

    setResults(filtered)
    setSelectedIndex(0)
  }, [query, allTools])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for calculators, tools..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <VoiceInput 
            onInput={(text) => setQuery(text)}
            className="ml-2 shrink-0"
          />
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 shrink-0">
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Results or Empty State */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors",
                    index === selectedIndex 
                      ? "bg-purple-50 dark:bg-purple-900/20" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    index === selectedIndex 
                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" 
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium truncate",
                      index === selectedIndex ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-gray-100"
                    )}>
                      {result.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.description}
                    </p>
                  </div>
                  <ArrowRight className={cn(
                    "h-4 w-4 opacity-0 transition-opacity",
                    index === selectedIndex && "opacity-100 text-purple-600 dark:text-purple-400"
                  )} />
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-8 px-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "sip-calculator", fallback: "SIP Calculator" },
                    { id: "bmi-calculator", fallback: "BMI Calculator" },
                    { id: "gst-calculator", fallback: "GST Calculator" },
                    { id: "age-calculator", fallback: "Age Calculator" },
                  ]
                ).map((item) => {
                  const label = localizeToolMeta({
                    dict,
                    toolId: item.id,
                    fallbackTitle: item.fallback,
                    fallbackDescription: "",
                  }).title

                  return (
                    <button
                      key={item.id}
                      onClick={() => setQuery(label)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-sans">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-sans">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-sans">
                ↵
              </kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-sans">
              Esc
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  )
}
