"use client"

import { Globe, Check, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useSettings } from "@/components/providers/SettingsProvider"
import { useTheme } from "next-themes"
import { toolsData } from '@/lib/toolsData'

export function SettingsSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    currency, 
    setCurrency, 
    availableCurrencies, 
    language, 
    setLanguage, 
    availableLanguages 
  } = useSettings()

  const { setTheme, resolvedTheme } = useTheme()

  const currentTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const currentLanguage = availableLanguages.find((l) => l.code === language)

  const supportedLangs = new Set(availableLanguages.map(l => l.code))
  const stripLocale = (path: string) => {
    const parts = (path || '/').split('/')
    const maybeLocale = parts[1]
    if (maybeLocale && supportedLangs.has(maybeLocale)) {
      const rest = '/' + parts.slice(2).join('/')
      return rest === '/' ? '/' : rest.replace(/\/$/, '')
    }
    return path || '/'
  }

  const findCategoryForCalc = (id: string): string | null => {
    for (const [categoryId, category] of Object.entries(toolsData)) {
      for (const sub of Object.values(category.subcategories ?? {})) {
        if ((sub as any).calculators.find((c: any) => c.id === id)) return categoryId
      }
    }
    return null
  }

  const buildLangPath = (basePath: string, code: string): string => {
    const parts = basePath.split('/').filter(Boolean)

    // basePath = /calculator/{id}
    if (parts.length === 2 && parts[0] === 'calculator') {
      const calcId = parts[1]
      if (code === 'en') return basePath
      const cat = findCategoryForCalc(calcId)
      return cat ? `/${code}/${cat}/${calcId}` : `/${code}${basePath}`
    }

    // basePath = /{category}/{id} (after locale strip from /{lang}/{category}/{id})
    if (parts.length === 2 && (toolsData as any)[parts[0]]) {
      const [cat, calcId] = parts
      if (code === 'en') return `/calculator/${calcId}`
      return `/${code}/${cat}/${calcId}`
    }

    // Other pages (/, /about, /blog, etc.)
    if (code === 'en') return basePath
    return `/${code}${basePath === '/' ? '' : basePath}`
  }

  const handleLanguageChange = (code: string) => {
    setLanguage(code)
    const basePath = stripLocale(pathname || '/')
    const nextPath = buildLangPath(basePath, code)
    router.push(nextPath)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Settings</span>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center text-[9px] font-semibold bg-primary text-primary-foreground rounded-full shadow-sm">
            {currency.symbol}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full sm:w-56 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}>
          {currentTheme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>Theme: {currentTheme === 'dark' ? 'Dark' : 'Light'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Regional</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="mr-2">Currency</span>
            <span className="ml-auto text-xs text-muted-foreground">{currency.code} ({currency.symbol})</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {availableCurrencies.map((curr) => (
              <DropdownMenuItem 
                key={curr.code} 
                onClick={() => setCurrency(curr.code)}
                className="justify-between"
              >
                <span>
                  {curr.flag ? <span className="emoji">{curr.flag} </span> : null}
                  {curr.name} ({curr.symbol})
                </span>
                {currency.code === curr.code && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="mr-2">Language</span>
            <span className="ml-auto text-xs text-muted-foreground">{currentLanguage?.nativeName || language.toUpperCase()}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {availableLanguages.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => handleLanguageChange(lang.code)}
                className="justify-between"
              >
                <span>
                  {lang.flag ? <span className="emoji">{lang.flag} </span> : null}
                  {lang.nativeName}
                </span>
                {language === lang.code && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
