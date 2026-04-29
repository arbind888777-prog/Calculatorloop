import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, BookOpen, Calculator, Clock, HelpCircle, Sigma } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RelatedCalculators } from '@/components/calculators/RelatedCalculators'
import { formatDate } from '@/lib/blogData'
import { collectCalculatorGuides, type CalculatorGuide } from '@/lib/calculatorGuides'
import { localizeToolMeta } from '@/lib/toolLocalization'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/siteUrl'
import { getMergedTranslations } from '@/lib/translations'
import { toolsData } from '@/lib/toolsData'

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

function GuideCard({
  guide,
  href,
  compact = false,
}: {
  guide: CalculatorGuide
  href: string
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-border bg-card transition-colors hover:border-primary/35 hover:bg-card/90 ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{guide.readingTime} min read</span>
        <span>|</span>
        <span>{formatDate(guide.updatedAt)}</span>
        {guide.source === 'database' ? <Badge variant="secondary">Live</Badge> : null}
      </div>
      <h3 className={`mt-3 font-semibold leading-snug transition-colors group-hover:text-primary ${compact ? 'text-base' : 'text-lg'}`}>
        {guide.title}
      </h3>
      <p className={`mt-2 text-sm leading-6 text-muted-foreground ${compact ? 'line-clamp-3' : 'line-clamp-4'}`}>
        {guide.description}
      </p>
      {guide.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {guide.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const id = normalizeCalculatorId(rawId)
  const info = findCategoryForCalculator(id)
  const language = (await headers()).get('x-calculator-language') || 'en'
  const dict = getMergedTranslations(language)

  if (!info) {
    return {
      title: 'Calculator Guides Not Found',
      description: 'The requested calculator guide hub could not be found.',
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

  const title = dbTranslation?.title || staticMeta.title
  const description = `Beginner guides, examples, formulas, and FAQs for ${title}.`
  const prefix = language !== 'en' ? `/${language}` : ''
  const canonical = `${getSiteUrl()}${prefix}/calculator/${id}/guides`

  return {
    title: `${title} Guides - Calculator Loop`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} Guides`,
      description,
      type: 'website',
      url: canonical,
      siteName: 'Calculator Loop',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} Guides`,
      description,
    },
  }
}

export default async function CalculatorGuideHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = normalizeCalculatorId(rawId)

  if (id && id !== rawId) {
    redirect(`/calculator/${id}/guides`)
  }

  const languageRaw = (await headers()).get('x-calculator-language') || 'en'
  const VALID_LANGS = new Set(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'es', 'pt', 'fr', 'de', 'id', 'ar', 'ur', 'ja'])
  const language = VALID_LANGS.has(languageRaw) ? languageRaw : 'en'
  const dict = getMergedTranslations(language)
  const prefix = language !== 'en' ? `/${language}` : ''

  const categoryInfo = findCategoryForCalculator(id)
  if (!categoryInfo) notFound()

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
        take: 60,
      },
    },
  })

  const dbTranslation = calculatorRecord?.translations[0]
  const staticMeta = localizeToolMeta({
    dict,
    toolId: id,
    fallbackTitle: categoryInfo.tool.title,
    fallbackDescription: categoryInfo.tool.description,
  })

  const meta = {
    title: dbTranslation?.title || staticMeta.title,
    description: dbTranslation?.metaDesc || staticMeta.description,
  }

  const {
    guidePosts,
    startHereGuide,
    exampleGuides,
    faqGuides,
    formulaGuides,
    moreGuides,
  } = collectCalculatorGuides({
    calculatorId: id,
    language,
    dbPosts: calculatorRecord?.blogPosts || [],
  })

  const sectionCards = [
    {
      id: 'examples',
      title: 'Worked examples',
      description: 'See sample inputs, use cases, and beginner-friendly walkthroughs.',
      count: exampleGuides.length,
      icon: BookOpen,
    },
    {
      id: 'formula',
      title: 'Formula and logic',
      description: 'Understand how results are calculated and what each number means.',
      count: formulaGuides.length,
      icon: Sigma,
    },
    {
      id: 'faq',
      title: 'FAQs and mistakes',
      description: 'Clear common doubts and avoid the mistakes beginners usually make.',
      count: faqGuides.length,
      icon: HelpCircle,
    },
  ].filter((section) => section.count > 0)

  const guideSections = [
    {
      id: 'examples',
      title: 'Worked examples',
      description: 'Good for users who want to see inputs and results in a practical scenario.',
      guides: exampleGuides,
    },
    {
      id: 'formula',
      title: 'Formula and explanation',
      description: 'Use these when you want to understand the calculation, not just the answer.',
      guides: formulaGuides,
    },
    {
      id: 'faq',
      title: 'FAQs and common mistakes',
      description: 'Helpful when users are stuck, confused, or trying to double-check the result.',
      guides: faqGuides,
    },
    {
      id: 'more',
      title: 'More guides',
      description: 'Additional reading for comparison, deeper learning, and related use cases.',
      guides: moreGuides,
    },
  ].filter((section) => section.guides.length > 0)

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6">
          <BackButton />
        </div>

        <section className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link href={`${prefix}/calculator/${id}`} className="transition-colors hover:text-foreground">
                  {meta.title}
                </Link>
                <span>/</span>
                <span>Guides</span>
              </div>

              <p className="mt-4 text-sm font-semibold text-primary">Guide Hub</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {meta.title} guides for beginners
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Read the basics, understand the formula, see examples, and then jump back into the calculator with confidence.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`${prefix}/calculator/${id}`}>
                  <Button size="lg" className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Use Calculator
                  </Button>
                </Link>
                {startHereGuide ? (
                  <Link href={`${prefix}/blog/${startHereGuide.slug}`}>
                    <Button size="lg" variant="outline" className="gap-2">
                      Read first guide
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
              <div className="rounded-2xl border bg-background/70 p-4">
                <div className="text-2xl font-bold">{guidePosts.length}</div>
                <p className="mt-1 text-sm text-muted-foreground">Guides linked to this calculator</p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <div className="text-2xl font-bold">{exampleGuides.length}</div>
                <p className="mt-1 text-sm text-muted-foreground">Example-based articles</p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <div className="text-2xl font-bold">{faqGuides.length + formulaGuides.length}</div>
                <p className="mt-1 text-sm text-muted-foreground">Explainers and FAQs</p>
              </div>
            </div>
          </div>
        </section>

        {guidePosts.length === 0 ? (
          <section className="mt-8 rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-2xl font-bold">Guides are coming soon</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This calculator does not have dedicated articles yet. You can still use the calculator now, and we will keep adding beginner guides, examples, and FAQs here.
            </p>
            <div className="mt-6">
              <Link href={`${prefix}/calculator/${id}`}>
                <Button>Open Calculator</Button>
              </Link>
            </div>
          </section>
        ) : (
          <>
            {startHereGuide ? (
              <section className="mt-8 rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">Start Here</p>
                    <h2 className="mt-1 text-2xl font-bold">Read this first</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This is the best first article for beginners using {meta.title}.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated {formatDate(startHereGuide.updatedAt)}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
                  <GuideCard guide={startHereGuide} href={`${prefix}/blog/${startHereGuide.slug}`} />

                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                    <h3 className="text-lg font-semibold">Best reading path</h3>
                    <ol className="mt-4 grid gap-3 text-sm text-muted-foreground">
                      <li>1. Read the beginner guide to understand what each input means.</li>
                      <li>2. Open the calculator and test it with your own numbers.</li>
                      <li>3. Review examples or FAQs if anything still feels unclear.</li>
                    </ol>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href={`${prefix}/blog/${startHereGuide.slug}`}>
                        <Button className="gap-2">
                          Read now
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`${prefix}/calculator/${id}`}>
                        <Button variant="outline">Try calculator</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {sectionCards.length > 0 ? (
              <section className="mt-8">
                <div className="grid gap-4 md:grid-cols-3">
                  {sectionCards.map((section) => {
                    const Icon = section.icon
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:border-primary/30"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <h2 className="mt-4 text-lg font-semibold">{section.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.description}</p>
                        <div className="mt-4 text-sm font-semibold text-primary">
                          {section.count} article{section.count === 1 ? '' : 's'}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </section>
            ) : null}

            <div className="mt-8 grid gap-8">
              {guideSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {section.guides.length} article{section.guides.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.guides.map((guide) => (
                      <GuideCard
                        key={guide.id}
                        guide={guide}
                        href={`${prefix}/blog/${guide.slug}`}
                        compact
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        <section className="mt-8 rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ready to use {meta.title}?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Learn a little, calculate with confidence, and come back here whenever you need another guide.
              </p>
            </div>
            <Link href={`${prefix}/calculator/${id}`}>
              <Button size="lg">Open Calculator</Button>
            </Link>
          </div>
        </section>

        <RelatedCalculators
          currentToolId={id}
          categoryId={categoryInfo.categoryId}
          subcategoryKey={categoryInfo.subcategoryKey}
        />
      </div>
    </main>
  )
}

export const dynamic = 'force-static'

export async function generateStaticParams() {
  try {
    const ids = Object.values(toolsData).flatMap((cat: any) =>
      Object.values(cat.subcategories ?? {}).flatMap((sub: any) => sub.calculators.map((c: any) => c.id))
    )
    const unique = Array.from(new Set(ids))
    return unique.map((id) => ({ id }))
  } catch (err) {
    console.error('guide hub generateStaticParams error:', err)
    return []
  }
}
