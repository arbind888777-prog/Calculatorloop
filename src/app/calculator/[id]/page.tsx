import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { calculatorComponents } from '@/lib/calculatorRegistry'
import { toolsData } from '@/lib/toolsData'
import { BackButton } from '@/components/ui/back-button'
import { StructuredData } from '@/components/seo/StructuredData'
import { RelatedCalculators } from '@/components/calculators/RelatedCalculators'
import { getMergedTranslations } from '@/lib/translations'
import { localizeToolMeta } from '@/lib/toolLocalization'
import { getSiteUrl } from '@/lib/siteUrl'

function normalizeCalculatorId(raw: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(raw ?? ''))
    } catch {
      return String(raw ?? '')
    }
  })()

  const slug = decoded.trim().toLowerCase()
  const noExt = slug.replace(/\.(html?|php)$/i, '')
  const normalized = noExt.replace(/_/g, '-').replace(/\s+/g, '-')

  // Legacy alias: timezone-* -> time-zone-*
  const timezoneNormalized = normalized.replace(/^timezone-/, 'time-zone-').replace(/-timezone-/, '-time-zone-')
  if (timezoneNormalized === 'timezone-converter') return 'time-zone-converter'

  return timezoneNormalized
}

function findCategoryForCalculator(id: string): { categoryId: string; subcategoryKey: string; categoryName: string; tool: any } | null {
  for (const [categoryId, category] of Object.entries(toolsData)) {
    for (const [subKey, sub] of Object.entries(category.subcategories ?? {})) {
      const tool = sub.calculators.find((calc) => calc.id === id)
      if (tool) {
        return { categoryId, subcategoryKey: subKey, categoryName: sub.name, tool }
      }
    }
  }
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const id = normalizeCalculatorId(rawId)
  const info = findCategoryForCalculator(id)
  const language = (await headers()).get('x-calculator-language') || 'en'
  const dict = getMergedTranslations(language)
  
  if (!info) {
    return {
      title: 'Calculator Not Found',
      description: 'The requested calculator could not be found.'
    }
  }

  const meta = localizeToolMeta({
    dict,
    toolId: id,
    fallbackTitle: info.tool.title,
    fallbackDescription: info.tool.description,
  })

  const prefix = language !== 'en' ? `/${language}` : ''
  const pathname = `${prefix}/calculator/${id}`
  const baseUrl = getSiteUrl()
  const canonical = `${baseUrl}${pathname}`

  return {
    title: `${meta.title} - Free Online Calculator | Calculator Loop`,
    description: `${meta.description} Accurate, fast, and free online ${meta.title} with instant results.`,
    keywords: [meta.title, `${meta.title} online`, 'financial calculator', 'free calculator', info.categoryName],
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${meta.title} - Free Online Calculator`,
      description: meta.description,
      type: 'website',
      url: canonical,
      siteName: 'Calculator Loop',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.title} - Free Online Calculator`,
      description: meta.description,
      images: ['/twitter-image'],
    }
  }
}

export default async function CalculatorPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params
    const id = normalizeCalculatorId(rawId)

    // Force canonical id so we always render the correct calculator implementation.
    if (id && id !== rawId) {
      redirect(`/calculator/${id}`)
    }

    const CalculatorComponent = calculatorComponents[id]
    const categoryInfo = findCategoryForCalculator(id)

    // Validate language header and fall back to 'en' for safety
    const languageRaw = (await headers()).get('x-calculator-language') || 'en'
    const VALID_LANGS = new Set(['en','hi','ta','te','bn','mr','gu','es','pt','fr','de','id','ar','ur','ja'])
    const language = VALID_LANGS.has(languageRaw) ? languageRaw : 'en'
    const dict = getMergedTranslations(language)
    const prefix = language !== 'en' ? `/${language}` : ''
    const baseUrl = getSiteUrl()
    const pathname = `${prefix}/calculator/${id}`

    const meta = categoryInfo
      ? localizeToolMeta({
          dict,
          toolId: id,
          fallbackTitle: categoryInfo.tool.title,
          fallbackDescription: categoryInfo.tool.description,
        })
      : null

    // If missing data, return 404 rather than throwing a server error.
    if (!CalculatorComponent || !categoryInfo) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-background pb-16">
        <StructuredData 
          title={meta?.title ?? categoryInfo.tool.title}
          description={meta?.description ?? categoryInfo.tool.description}
          categoryId={categoryInfo.categoryId}
          categoryName={categoryInfo.categoryName} 
          pathname={pathname}
          baseUrl={baseUrl}
        />
        
        <div className="container mx-auto px-4 pt-6">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <CalculatorComponent 
            id={id} 
            title={meta?.title ?? categoryInfo.tool.title}
            description={meta?.description ?? categoryInfo.tool.description}
          />

          <section className="mt-10 rounded-lg border bg-card p-6 text-card-foreground">
            <h2 className="text-xl font-semibold">About {meta?.title ?? categoryInfo.tool.title}</h2>
            <p className="mt-2 text-muted-foreground">
              {meta?.description ?? categoryInfo.tool.description} Updated for 2026 with fast, accurate results on mobile and desktop.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <li>Instant calculation with clear outputs</li>
              <li>No signup, free to use</li>
              <li>Works on mobile, tablet, and desktop</li>
              <li>Useful for quick planning and comparisons</li>
            </ul>
          </section>
          
          <RelatedCalculators 
            currentToolId={id}
            categoryId={categoryInfo.categoryId}
            subcategoryKey={categoryInfo.subcategoryKey}
          />
        </div>
      </div>
    )
  } catch (err) {
    const digest = typeof err === 'object' && err && 'digest' in err ? String((err as any).digest) : ''
    const isExpectedNotFound = digest === 'NEXT_HTTP_ERROR_FALLBACK;404'

    if (!isExpectedNotFound) {
      console.error('Calculator page render error:', err)
    }

    // Map unexpected errors to 404 to avoid 5xx responses for malformed requests or bad params
    notFound()
  }
}

// Force static rendering for all calculator pages and provide static params
export const dynamic = 'force-static'

export async function generateStaticParams() {
  try {
    const ids = Object.values(toolsData).flatMap((cat: any) =>
      Object.values(cat.subcategories ?? {}).flatMap((sub: any) => sub.calculators.map((c: any) => c.id))
    )
    const unique = Array.from(new Set(ids))
    return unique.map((id) => ({ id }))
  } catch (err) {
    console.error('generateStaticParams error:', err)
    return []
  }
}
