
"use client"

import Link from 'next/link'
import { Heart, Calendar, DollarSign, Binary, GraduationCap, Laptop, FlaskConical, Wrench, Briefcase, Home, ArrowRight } from "lucide-react"
import { toolsData } from '@/lib/toolsData'
import { useSettings } from "@/components/providers/SettingsProvider"
import { getMergedTranslations } from "@/lib/translations"

export function CategorySection() {
  const { language } = useSettings()
  const t = getMergedTranslations(language)

  const prefix = language === 'en' ? '' : `/${language}`
  const withLocale = (path: string) => `${prefix}${path}`

  const categoryMeta: Record<string, { name: string; description: string; icon: any; color: string }> = {
    financial: {
      name: t.nav.financial,
      description: t.categories.financialDescription,
      icon: DollarSign,
      color: "from-blue-500 to-cyan-500",
    },
    health: {
      name: t.nav.health,
      description: t.categories.healthDescription,
      icon: Heart,
      color: "from-pink-500 to-rose-500",
    },
    math: {
      name: t.nav.math,
      description: t.categories.mathDescription,
      icon: Binary,
      color: "from-purple-500 to-indigo-500",
    },
    datetime: {
      name: t.nav.datetime,
      description: t.categories.datetimeDescription,
      icon: Calendar,
      color: "from-green-500 to-emerald-500",
    },
    education: {
      name: t.nav.education,
      description: t.categories.educationDescription,
      icon: GraduationCap,
      color: "from-orange-500 to-amber-500",
    },
    technology: {
      name: t.nav.technology,
      description: t.categories.technologyDescription,
      icon: Laptop,
      color: "from-cyan-500 to-blue-500",
    },
    scientific: {
      name: t.nav.science,
      description: t.categories.scienceDescription,
      icon: FlaskConical,
      color: "from-violet-500 to-purple-500",
    },
    construction: {
      name: t.nav.construction,
      description: t.categories.constructionDescription,
      icon: Wrench,
      color: "from-orange-500 to-red-500",
    },
    business: {
      name: t.nav.business,
      description: t.categories.businessDescription,
      icon: Briefcase,
      color: "from-yellow-400 to-amber-500",
    },
    everyday: {
      name: t.nav.everyday,
      description: t.categories.everydayDescription,
      icon: Home,
      color: "from-lime-400 to-cyan-400",
    },
  }

  const categories = Object.entries(toolsData)
    .map(([id, data]) => {
      const calculators = Object.values(data.subcategories ?? {}).flatMap((subcategory) =>
        subcategory.calculators
      )
      return {
        id,
        count: calculators.length,
        ...categoryMeta[id],
      }
    })
    .filter((category) => category.count > 0 && categoryMeta[category.id])

  return (
    <section id="categories" className="w-full py-16 md:py-24 bg-background" aria-labelledby="categories-heading">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <h2 id="categories-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t.cta.exploreCategories}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            {t.cta.browseDescription}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={withLocale(`/category/${category.id}`)}
                className="group relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 block h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {category.count} {t.common.tools}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.common.browseCategory} <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
