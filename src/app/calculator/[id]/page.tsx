import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { calculatorComponents } from '@/lib/calculatorRegistry'
import { toolsData } from '@/lib/toolsData'
import { BackButton } from '@/components/ui/back-button'
import { StructuredData } from '@/components/seo/StructuredData'
import { RelatedCalculators } from '@/components/calculators/RelatedCalculators'
import { getMergedTranslations } from '@/lib/translations'
import { localizeToolMeta } from '@/lib/toolLocalization'
import { getSiteUrl } from '@/lib/siteUrl'
import { FAQSection } from '@/components/calculators/ui/FAQSection'
import { CalculatorSchema, FAQSchema, HowToSchema } from '@/components/seo/AdvancedSchema'
import { getCalculatorSeoProfile } from '@/lib/calculatorSeo'
import { prisma } from '@/lib/prisma'
import { collectCalculatorGuides } from '@/lib/calculatorGuides'

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

  const calculatorRecord = await prisma.calculator.findUnique({
    where: { slug: id },
    include: {
      translations: {
        where: { language },
        take: 1,
      },
    },
  })
  const dbTranslation = calculatorRecord?.translations[0]

  const staticMeta = localizeToolMeta({
    dict,
    toolId: id,
    fallbackTitle: info.tool.title,
    fallbackDescription: info.tool.description,
  })

  const metaTitle = dbTranslation?.metaTitle || staticMeta.title;
  const metaDescription = dbTranslation?.metaDesc || staticMeta.description;

  const prefix = language !== 'en' ? `/${language}` : ''
  const pathname = `${prefix}/calculator/${id}`
  const baseUrl = getSiteUrl()
  const canonical = `${baseUrl}${pathname}`
  const seoProfile = getCalculatorSeoProfile({
    id,
    title: metaTitle,
    description: metaDescription ?? '',
    categoryId: info.categoryId,
    categoryName: info.categoryName,
  })

  return {
    title: `${metaTitle} - Free Online Calculator | Calculator Loop`,
    description: seoProfile.summary,
    keywords: seoProfile.keywords,
    authors: [{ name: 'Calculator Loop Team' }],
    creator: 'Calculator Loop',
    publisher: 'Calculator Loop',
    category: info.categoryName,
    classification: seoProfile.articleSection,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${metaTitle} - Free Online Calculator`,
      description: seoProfile.summary,
      type: 'website',
      url: canonical,
      siteName: 'Calculator Loop',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: metaTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${metaTitle} - Free Online Calculator`,
      description: seoProfile.summary,
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

    const calculatorRecord = await prisma.calculator.findUnique({
      where: { slug: id },
      include: {
        translations: {
          where: { language },
          take: 1,
        },
        blogPosts: {
          where: {
            status: 'PUBLISHED',
            translations: {
              some: {
                language,
                isPublished: true,
              },
            },
          },
          include: {
            translations: {
              where: { language, isPublished: true },
              take: 1,
            },
          },
          orderBy: [
            { viewCount: 'desc' },
            { updatedAt: 'desc' },
          ],
          take: 6,
        },
      },
    })
    const dbTranslation = calculatorRecord?.translations[0]

    const staticMeta = categoryInfo
      ? localizeToolMeta({
          dict,
          toolId: id,
          fallbackTitle: categoryInfo.tool.title,
          fallbackDescription: categoryInfo.tool.description,
        })
      : null

    const meta = staticMeta ? {
      title: dbTranslation?.title || staticMeta.title,
      description: dbTranslation?.metaDesc || staticMeta.description
    } : null;

    const seoProfile = categoryInfo && meta
      ? getCalculatorSeoProfile({
          id,
          title: meta.title,
          description: meta.description ?? '',
          categoryId: categoryInfo.categoryId,
          categoryName: categoryInfo.categoryName,
        })
      : null

    // If missing data, return 404 rather than throwing a server error.
    if (!CalculatorComponent || !categoryInfo || !meta || !seoProfile) {
      notFound()
    }

    const canonicalUrl = `${baseUrl}${pathname}`
    const {
      guidePosts,
      startHereGuide,
      moreGuides,
    } = collectCalculatorGuides({
      calculatorId: id,
      language,
      dbPosts: calculatorRecord?.blogPosts || [],
    })
    const previewGuides = moreGuides.slice(0, 3)

    return (
      <div className="min-h-screen bg-background pb-16">
        <StructuredData 
          title={meta.title}
          description={seoProfile.summary}
          categoryId={categoryInfo.categoryId}
          categoryName={categoryInfo.categoryName} 
          pathname={pathname}
          baseUrl={baseUrl}
          featureList={seoProfile.featureList}
          applicationCategory={seoProfile.applicationCategory}
        />
        <CalculatorSchema
          name={meta.title}
          description={seoProfile.summary}
          url={canonicalUrl}
          category={categoryInfo.categoryName}
        />
        <FAQSchema faqs={seoProfile.faqs} />
        <HowToSchema name={`How to use ${meta.title}`} description={meta.description ?? ''} steps={seoProfile.howToSteps} />
        
        <div className="container mx-auto px-4 pt-6">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <CalculatorComponent 
            id={id} 
            title={meta.title}
            description={meta.description ?? ''}
          />

          {startHereGuide && (
            <section className="mt-10 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Start Here</p>
                  <h2 className="mt-1 text-2xl font-bold">Guides for {meta.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Beginners can read one guide first, then use the calculator with more confidence.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {guidePosts.length} linked guide{guidePosts.length === 1 ? '' : 's'}
                  </div>
                  <Link
                    href={`${prefix}/calculator/${id}/guides`}
                    className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    View all guides
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Link
                  href={`${prefix}/blog/${startHereGuide.slug}`}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Recommended first
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {startHereGuide.readingTime} min read
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{startHereGuide.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {startHereGuide.description}
                  </p>
                </Link>

                <div className="grid gap-3">
                  {previewGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`${prefix}/blog/${guide.slug}`}
                      className="rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/30 hover:bg-background"
                    >
                      <div className="text-xs text-muted-foreground">{guide.readingTime} min read</div>
                      <h3 className="mt-2 text-base font-semibold leading-snug">{guide.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {guide.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="mt-10 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-xl font-semibold">About {meta.title}</h2>
            <p className="mt-2 text-muted-foreground">
              {seoProfile.summary}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold">Why this page helps</h3>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {seoProfile.benefitPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold">How to use it well</h3>
                <ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {seoProfile.howToSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="mt-6 rounded-xl border bg-background/60 p-4">
              <h3 className="text-base font-semibold">Expert tips</h3>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                {seoProfile.expertTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <FAQSection faqs={seoProfile.faqs} />
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
