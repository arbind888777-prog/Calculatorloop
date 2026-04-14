import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { toolsData } from '@/lib/toolsData'
import { implementedCalculatorIds } from '@/lib/implementedCalculators'
import { CategoryPageClient } from '@/components/pages/CategoryPageClient'
import { getSiteUrl } from '@/lib/siteUrl'
import { FAQSection } from '@/components/calculators/ui/FAQSection'
import { BreadcrumbSchema, FAQSchema, HowToSchema } from '@/components/seo/AdvancedSchema'
import { getCategorySeoProfile } from '@/lib/categorySeo'
import { getMergedTranslations } from '@/lib/translations'
import { getDictString, localizeSubcategoryName } from '@/lib/toolLocalization'

export const dynamic = 'force-static'
export const revalidate = 3600

const VALID_LANGS = new Set(['en','hi','ta','te','bn','mr','gu','es','pt','fr','de','id','ar','ur','ja'])

function getLocalizedCategoryName(categoryId: string, dict: Record<string, any>, fallback: string) {
  const navMap: Record<string, string> = {
    financial: 'nav.financial',
    health: 'nav.health',
    math: 'nav.math',
    datetime: 'nav.datetime',
    education: 'nav.education',
    technology: 'nav.technology',
    scientific: 'nav.scientific',
    construction: 'nav.construction',
    business: 'nav.business',
    everyday: 'nav.everyday',
  }

  const key = navMap[categoryId]
  return key ? getDictString(dict, key, fallback) : fallback
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const categoryId = id || ''
  const languageRaw = (await headers()).get('x-calculator-language') || 'en'
  const language = VALID_LANGS.has(languageRaw) ? languageRaw : 'en'
  const dict = getMergedTranslations(language)

  const baseUrl = getSiteUrl()

  const readableNames: Record<string, string> = {
    financial: 'Financial Calculators',
    health: 'Health & Fitness Calculators',
    math: 'Math Calculators',
    datetime: 'Date & Time Calculators',
    education: 'Education Calculators',
    technology: 'Technology Calculators',
    scientific: 'Science Calculators',
    construction: 'Construction Calculators',
    business: 'Business Calculators',
    everyday: 'Everyday Calculators'
  }

  const categoryData = toolsData[categoryId]
  if (!categoryData) {
    return {
      title: 'Category Not Found | Calculator Loop',
      description: 'The requested calculator category could not be found.',
      robots: { index: false, follow: false },
    }
  }

  const calculatorsCount = Object.values(categoryData.subcategories ?? {}).reduce((sum, sub) => {
    return sum + sub.calculators.filter((calc) => implementedCalculatorIds.has(calc.id)).length
  }, 0)
  const toolTitles = Object.values(categoryData.subcategories ?? {}).flatMap((sub) =>
    sub.calculators.filter((calc) => implementedCalculatorIds.has(calc.id)).map((calc) => calc.title)
  )

  const categoryName = getLocalizedCategoryName(categoryId, dict, readableNames[categoryId] || 'Calculators')
  const seoProfile = getCategorySeoProfile({ categoryId, categoryName, calculatorsCount, toolTitles, language })
  const title = `${categoryName} (${calculatorsCount}+ Tools) | Calculator Loop`
  const description = seoProfile.summary

  const prefix = language !== 'en' ? `/${language}` : ''
  const canonical = `${baseUrl}${prefix}/category/${categoryId}`

  return {
    title,
    description,
    keywords: seoProfile.keywords,
    authors: [{ name: 'Calculator Loop Team' }],
    creator: 'Calculator Loop',
    publisher: 'Calculator Loop',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Calculator Loop',
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/twitter-image'],
    },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categoryId = id || ''
  const languageRaw = (await headers()).get('x-calculator-language') || 'en'
  const language = VALID_LANGS.has(languageRaw) ? languageRaw : 'en'
  const dict = getMergedTranslations(language)

  const readableNames: Record<string, string> = {
    financial: 'Financial Calculators',
    health: 'Health & Fitness',
    math: 'Math Calculators',
    datetime: 'Date & Time',
    education: 'Education',
    technology: 'Technology',
    scientific: 'Science',
    construction: 'Construction',
    business: 'Business',
    everyday: 'Everyday Life'
  }

  const categoryData = toolsData[categoryId]
  const subcategoryList = categoryData?.subcategories
    ? Object.entries(categoryData.subcategories).map(([key, sub]) => ({
        key,
        name: localizeSubcategoryName(dict, key, sub.name),
        calculators: sub.calculators.filter((calc) => implementedCalculatorIds.has(calc.id)),
      }))
    : []

  const allCalculators = subcategoryList.flatMap((s) => s.calculators)

  if (!categoryData) {
    notFound()
  }

  const categoryName = getLocalizedCategoryName(categoryId, dict, readableNames[categoryId] || 'Calculators')
  const calculatorsCount = allCalculators.length
  const seoProfile = getCategorySeoProfile({
    categoryId,
    categoryName,
    calculatorsCount,
    toolTitles: allCalculators.map((calc) => calc.title),
    language,
  })
  const baseUrl = getSiteUrl()
  const prefix = language !== 'en' ? `/${language}` : ''
  const canonical = `${baseUrl}${prefix}/category/${categoryId}`
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    description: seoProfile.summary,
    url: canonical,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: allCalculators.slice(0, 20).map((calc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: calc.title,
        url: `${baseUrl}/calculator/${calc.id}`,
      })),
    },
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: seoProfile.labels.homeLabel, url: `${baseUrl}${prefix || ''}` },
          { name: categoryName, url: canonical },
        ]}
      />
      <FAQSchema faqs={seoProfile.faqs} />
      <HowToSchema name={seoProfile.labels.howToTitle} description={seoProfile.summary} steps={seoProfile.howToSteps} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <CategoryPageClient
        categoryId={categoryId}
        categoryName={categoryName}
        subcategoryList={subcategoryList}
      />

      <div className="container mx-auto px-4 pb-16 space-y-8">
        <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold">{seoProfile.labels.aboutHeading}</h2>
          <p className="mt-3 text-muted-foreground">{seoProfile.summary}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">{seoProfile.labels.whyUseTitle}</h3>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {seoProfile.benefitPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold">{seoProfile.labels.howToTitle}</h3>
              <ol className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {seoProfile.howToSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="mt-6 rounded-xl border bg-background/60 p-4">
            <h3 className="text-base font-semibold">{seoProfile.labels.expertTipsTitle}</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              {seoProfile.expertTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold">{seoProfile.labels.popularToolsTitle}</h2>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
            {allCalculators.slice(0, 12).map((calc) => (
              <div key={calc.id}>{calc.title}</div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <FAQSection faqs={seoProfile.faqs} title={seoProfile.labels.faqTitle} />
        </section>
      </div>
    </>
  )
}
