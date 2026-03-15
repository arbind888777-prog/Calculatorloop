"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { toolsData } from "@/lib/toolsData"
import { calculatorComponents } from "@/lib/calculatorRegistry"
import { useSettings } from "@/components/providers/SettingsProvider"
import { getMergedTranslations } from "@/lib/translations"
import { localizeToolMeta } from "@/lib/toolLocalization"
import { 
  X, 
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  HandCoins, TrendingUp, FileText, ArrowLeftRight, Landmark, PieChart, Calculator, Ruler, Utensils, Activity, Shapes, BarChart, Clock, GraduationCap, ClipboardCheck, Wifi, Shield, HardDrive, Atom, FlaskConical, Rocket, Microscope, User, Home, Car, Briefcase, Coins, Bike, FastForward, CheckCircle, Percent, Calendar, Scale, ArrowUp, RotateCw, Umbrella, PiggyBank, TrendingDown, Banknote, Wallet, Gift, Receipt, CalendarCheck, Globe, Bitcoin, Ship, Send, Flame, Droplets, HeartPulse, Moon, Apple, Dumbbell, Brain, Sigma, Hourglass, ShoppingCart, Tag, CreditCard, LogOut, LogIn,
  PenSquare, Info, Phone, Heart, History
} from "lucide-react"

// Icon mapping for subcategories
const subcategoryIconMap: Record<string, any> = {
  'loan': HandCoins,
  'investment': TrendingUp,
  'tax': FileText,
  'currency': ArrowLeftRight,
  'banking': Landmark,
  'business': PieChart,
  'misc': Calculator,
  'insurance': Shield,
  'real-estate': Home,
  'credit-card': CreditCard,
  'retirement': Umbrella,
  'profit-analysis': PieChart,
  'pricing-cost': Tag,
  'valuation-equity': PieChart,
  'freelance-rates': User,
  'food-dining': Utensils,
  'conversion-tools': ArrowLeftRight,
  'shopping-budgeting': ShoppingCart,
  'academic-grades': GraduationCap,
  'test-preparation': ClipboardCheck,
  'networking': Wifi,
  'security': Shield,
  'storage-data': HardDrive,
  'physics': Atom,
  'chemistry': FlaskConical,
  'astronomy-space': Rocket,
  'scientific-notation': Microscope,
  'body-measurements': Ruler,
  'nutrition-calories': Apple,
  'fitness-performance': Activity,
  'algebra-geometry': Shapes,
  'statistics-probability': BarChart,
  'date-time-tools': Clock,
}

// Icon mapping for calculator types (reused from page.tsx)
const calculatorIconMap: Record<string, any> = {
  'personal-loan-emi': User,
  'home-loan-emi': Home,
  'car-loan-emi': Car,
  'education-loan-emi': GraduationCap,
  'business-loan-emi': Briefcase,
  'gold-loan-emi': Coins,
  'two-wheeler-loan': Bike,
  'loan-prepayment-impact': FastForward,
  'loan-eligibility': CheckCircle,
  'loan-comparison': ArrowLeftRight,
  'simple-interest-loan': Percent,
  'compound-interest-loan': Percent,
  'loan-amortization': Calendar,
  'remaining-loan-balance': Scale,
  'top-up-loan': ArrowUp,
  'sip-calculator': TrendingUp,
  'mutual-fund-returns': Briefcase,
  'compound-interest-investment': Percent,
  'cagr-calculator': BarChart,
  'roi-calculator': PieChart,
  'fd-calculator': Landmark,
  'rd-calculator': RotateCw,
  'nps-calculator': Umbrella,
  'ppf-calculator': PiggyBank,
  'retirement-corpus': Clock,
  'lumpsum-calculator': HandCoins,
  'inflation-impact': TrendingDown,
  'income-tax-calculator': FileText,
  'salary-breakup': Banknote,
  'hra-calculator': Home,
  'pf-calculator': Wallet,
  'gratuity-calculator': Gift,
  'tds-calculator': Receipt,
  'gst-calculator': FileText,
  'professional-tax': Briefcase,
  'advance-tax-calculator': CalendarCheck,
  'post-tax-income': HandCoins,
  'currency-converter': ArrowLeftRight,
  'crypto-profit-loss': Bitcoin,
  'forex-margin': TrendingUp,
  'exchange-rate-impact': Globe,
  'bitcoin-converter': Bitcoin,
  'import-export-duty': Ship,
  'gold-silver-price': Coins,
  'international-transfer': Send,
  'savings-account-interest': PiggyBank,
  'deposit-maturity': Activity,
  'interest-rate-comparison': Percent,
  'deposit-growth': TrendingUp,
  'rd-planner': Calendar,
  'bank-charges': Receipt,
  'atm-withdrawal-charges': Banknote,
  'loan-against-fd': Landmark,
  'money-market-calculator': BarChart,
  'profit-margin': Percent,
  'break-even-calculator': Scale,
  'discount-calculator': Receipt,
  'roas-calculator': TrendingUp,
  'working-capital': Briefcase,
  'markup-calculator': ArrowUp,
  'commission-calculator': HandCoins,
  'tip-calculator': Wallet,
  'age-calculator': Calendar,
  'date-difference': CalendarCheck,
  'percentage-calculator': Percent,
  'fuel-cost-calculator': Car,
  'bmi-calculator': Scale,
  'bmr-calculator': Flame,
  'body-fat-calculator': Scale,
  'calorie-calculator': Flame,
  'ideal-weight-calculator': Scale,
  'macro-calculator': PieChart,
  'tdee-calculator': Activity,
  'water-intake-calculator': Droplets,
  'lean-body-mass': Activity,
  'waist-hip-ratio': Ruler,
  'protein-calculator': BarChart,
  'calories-burned': Activity,
  'target-heart-rate': HeartPulse,
  'sleep-calculator': Moon,
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onSearchClick: () => void
  activeCategory: string | null
  setActiveCategory: (category: string | null) => void
  expandedSubcategory: string | null
  setExpandedSubcategory: (subcategory: string | null) => void
  categories: any[]
}

export function MobileMenu({
  isOpen,
  onClose,
  activeCategory,
  setActiveCategory,
  expandedSubcategory,
  setExpandedSubcategory,
  categories,
  onSearchClick
}: MobileMenuProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { language } = useSettings()
  const lastCategoryRef = useRef<string | null>(null)

  const dict = useMemo(() => getMergedTranslations(language), [language])

  const prefix = language && language !== 'en' ? `/${language}` : ''

  const withLocale = (href: string) => {
    if (!href) return href
    if (href.startsWith('#')) return `${prefix}/${href}`
    if (!href.startsWith('/')) return href
    if (!prefix) return href
    if (href === '/') return prefix
    return `${prefix}${href}`
  }

  useEffect(() => {
    if (!activeCategory) return
    if (lastCategoryRef.current === activeCategory) return

    const subKeys = Object.keys(toolsData[activeCategory]?.subcategories || {})
    if (subKeys.length) {
      setExpandedSubcategory(subKeys[0])
    }
    lastCategoryRef.current = activeCategory
    // Preload a handful of calculators in this category to speed first open
    const warmCalculators = Object.values(toolsData[activeCategory]?.subcategories || {})
      .flatMap((sub) => sub.calculators)
      .slice(0, 6)

    warmCalculators.forEach((tool: any) => {
      const Comp: any = calculatorComponents[tool.id]
      Comp?.preload?.()
    })
  }, [activeCategory, setExpandedSubcategory])

  const handleCategoryClick = (key: string) => {
    if (key === 'all') {
      onClose()
      return
    }
    setActiveCategory(key)
    setExpandedSubcategory(null)
  }

  const handleBackToCategories = () => {
    setActiveCategory(null)
  }

  const toggleSubcategory = (subKey: string) => {
    setExpandedSubcategory(expandedSubcategory === subKey ? null : subKey)
  }

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute top-0 right-0 h-full w-[320px] bg-background border-l border-border/40 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-4 flex items-center justify-between border-b border-border/40">
          <span className="font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Search */}
          <div className="relative" onClick={onSearchClick}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              readOnly
              placeholder="Search calculators..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-[#00D4FF] focus:outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Auth Section */}
          <div className="p-4 bg-secondary/20 rounded-xl border border-border/50">
            {session?.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{session.user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{session.user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2"
                    size="sm"
                  >
                    <Link href={withLocale("/profile")} onClick={onClose}>
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" 
                    size="sm"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground text-center">
                  Sign in to save your calculations and access premium features.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Link href={withLocale("/login")} onClick={onClose}>
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white border-none hover:opacity-90 gap-2"
                  >
                    <Link href={withLocale("/register")} onClick={onClose}>
                      <User className="h-4 w-4" />
                      Register
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="space-y-3">
            {!activeCategory ? (
              // Category List View
              <>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
                <div className="grid gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon
                    return (
                      <button 
                        key={category.key} 
                        onClick={() => handleCategoryClick(category.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-white font-medium transition-transform hover:scale-[1.02] w-full text-left ${category.color}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex-1">{category.name}</span>
                        {category.key !== 'all' && <ChevronRight className="h-4 w-4 opacity-70" />}
                      </button>
                    )
                  })}
                </div>

                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6">Quick Links</h3>
                <div className="grid gap-2">
                  <Link href={withLocale("/")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.home}</span>
                  </Link>
                  <Link href={withLocale("/popular")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.popular}</span>
                  </Link>
                  <Link href={withLocale("/favorites")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.favorites}</span>
                  </Link>
                  <Link href={withLocale("/history")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.history}</span>
                  </Link>
                  <Link href={withLocale("/blog")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <PenSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.blog}</span>
                  </Link>
                  <Link href={withLocale("/about")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.about}</span>
                  </Link>
                  <Link href={withLocale("/contact")} onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{dict.nav.contact}</span>
                  </Link>
                </div>
              </>
            ) : (
              // Subcategory/Tools View
              <div className="animate-in slide-in-from-right duration-300">
                <button 
                  onClick={handleBackToCategories}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#00D4FF] mb-4 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Categories
                </button>
                
                <h3 className="text-lg font-bold mb-4 capitalize flex items-center gap-2">
                  {categories.find(c => c.key === activeCategory)?.name}
                </h3>

                <div className="space-y-3">
                  {toolsData[activeCategory] && Object.entries(toolsData[activeCategory].subcategories).map(([subKey, subcategory]) => {
                    const isExpanded = expandedSubcategory === subKey
                    const SubIcon = subcategoryIconMap[subKey] || Calculator
                    
                    return (
                      <div key={subKey} className="border border-border/50 rounded-xl overflow-hidden bg-secondary/20">
                        <button
                          onClick={() => toggleSubcategory(subKey)}
                          className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-secondary/40' : 'hover:bg-secondary/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg ${
                              // Use the parent category color for the icon background
                              categories.find(c => c.key === activeCategory)?.color || 'bg-primary'
                            }`}>
                              <SubIcon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-sm">{subcategory.name}</div>
                              <div className="text-xs text-muted-foreground">{subcategory.calculators.length} calculators</div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-2 space-y-2 bg-background/50 border-t border-border/40">
                            {subcategory.calculators.map((tool) => {
                              const ToolIcon = calculatorIconMap[tool.id] || Calculator
                              const meta = localizeToolMeta({
                                dict,
                                toolId: tool.id,
                                fallbackTitle: tool.title,
                                fallbackDescription: tool.description,
                              })
                              const href = withLocale(`/calculator/${tool.id}`)

                              return (
                              <Link
                                key={tool.id}
                                href={href}
                                onClick={onClose}
                                onMouseEnter={() => router.prefetch(href)}
                                onFocus={() => router.prefetch(href)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-[#00D4FF] transition-colors">
                                  <ToolIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate group-hover:text-[#00D4FF] transition-colors">{meta.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">{meta.description}</div>
                                </div>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              </Link>
                            )})}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
