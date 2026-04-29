import { allBlogPosts, calculateReadingTime, type BlogPost } from '@/lib/blogData'

const START_HERE_TAGS = ['beginner', 'how-to', 'guide', 'basics', 'getting-started', 'start-here']
const EXAMPLE_TAGS = ['example', 'examples', 'use-case', 'use-cases', 'scenario', 'case-study', 'case-studies']
const FAQ_TAGS = ['faq', 'faqs', 'questions', 'common-mistakes', 'mistakes', 'troubleshooting']
const FORMULA_TAGS = ['formula', 'formulas', 'calculation', 'calculations', 'explained', 'working']

export interface CalculatorGuide {
  id: string
  slug: string
  title: string
  description: string
  readingTime: number
  tags: string[]
  updatedAt: string
  publishedAt: string
  category: string
  source: 'database' | 'static'
}

interface DatabaseGuideTranslation {
  title: string
  metaDesc: string | null
  content: string
  wordCount: number | null
  urlSlug: string
  publishedAt: Date | null
}

interface DatabaseGuidePost {
  id: string
  slug: string
  category: string | null
  tags: string[] | null
  createdAt: Date
  updatedAt: Date
  translations: DatabaseGuideTranslation[]
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase()
}

function hasAnyTag(tags: string[], matches: string[]) {
  const normalizedTags = tags.map(normalizeTag)
  return matches.some((match) => normalizedTags.includes(match))
}

function rankGuide(tags: string[]) {
  if (hasAnyTag(tags, START_HERE_TAGS)) return 0
  if (hasAnyTag(tags, EXAMPLE_TAGS)) return 1
  if (hasAnyTag(tags, FORMULA_TAGS)) return 2
  if (hasAnyTag(tags, FAQ_TAGS)) return 3
  return 4
}

function plainTextFromHtml(content: string) {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function buildGuideDescription(content: string, metaDesc?: string | null) {
  if (metaDesc?.trim()) return metaDesc.trim()

  const plainText = plainTextFromHtml(content)
  if (plainText.length <= 160) return plainText
  return `${plainText.slice(0, 157).trim()}...`
}

function mapDatabaseGuide(language: string, post: DatabaseGuidePost): CalculatorGuide | null {
  const translation = post.translations[0]
  if (!translation) return null

  const plainText = plainTextFromHtml(translation.content)
  return {
    id: post.id,
    slug: language === 'en' ? post.slug : translation.urlSlug,
    title: translation.title,
    description: buildGuideDescription(translation.content, translation.metaDesc),
    readingTime: Math.max(1, Math.ceil((translation.wordCount || plainText.split(/\s+/).length) / 200)),
    tags: post.tags || [],
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: (translation.publishedAt || post.createdAt).toISOString(),
    category: post.category || 'general',
    source: 'database',
  }
}

function mapStaticGuide(post: BlogPost): CalculatorGuide {
  return {
    id: `static:${post.slug}`,
    slug: post.slug,
    title: post.title,
    description: post.description,
    readingTime: post.readingTime || calculateReadingTime(post.content),
    tags: post.tags || [],
    updatedAt: post.updatedAt || post.publishedAt,
    publishedAt: post.publishedAt,
    category: post.category,
    source: 'static',
  }
}

function sortGuides(a: CalculatorGuide, b: CalculatorGuide) {
  const rankDiff = rankGuide(a.tags) - rankGuide(b.tags)
  if (rankDiff !== 0) return rankDiff
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function collectCalculatorGuides({
  calculatorId,
  language,
  dbPosts,
}: {
  calculatorId: string
  language: string
  dbPosts: DatabaseGuidePost[]
}) {
  const mappedDatabaseGuides = dbPosts
    .map((post) => mapDatabaseGuide(language, post))
    .filter((post): post is CalculatorGuide => Boolean(post))

  const mappedStaticGuides = language === 'en'
    ? allBlogPosts
        .filter((post) => post.toolId === calculatorId)
        .map(mapStaticGuide)
    : []

  const mergedBySlug = new Map<string, CalculatorGuide>()
  for (const guide of [...mappedDatabaseGuides, ...mappedStaticGuides]) {
    if (!mergedBySlug.has(guide.slug)) {
      mergedBySlug.set(guide.slug, guide)
    }
  }

  const guidePosts = Array.from(mergedBySlug.values()).sort(sortGuides)
  const startHereGuide = guidePosts.find((post) => hasAnyTag(post.tags, START_HERE_TAGS)) || guidePosts[0] || null

  const remainingGuides = guidePosts.filter((post) => post.id !== startHereGuide?.id)
  const exampleGuides = remainingGuides.filter((post) => hasAnyTag(post.tags, EXAMPLE_TAGS))
  const faqGuides = remainingGuides.filter((post) => hasAnyTag(post.tags, FAQ_TAGS))
  const formulaGuides = remainingGuides.filter((post) => hasAnyTag(post.tags, FORMULA_TAGS))

  const groupedGuideIds = new Set([
    ...exampleGuides.map((post) => post.id),
    ...faqGuides.map((post) => post.id),
    ...formulaGuides.map((post) => post.id),
  ])

  const moreGuides = remainingGuides.filter((post) => !groupedGuideIds.has(post.id))

  return {
    guidePosts,
    startHereGuide,
    exampleGuides,
    faqGuides,
    formulaGuides,
    moreGuides,
  }
}
