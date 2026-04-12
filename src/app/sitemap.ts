import { MetadataRoute } from 'next'
import { toolsData } from '@/lib/toolsData'
import { allBlogPosts } from '@/lib/blogData'
import { getAllMarkdownBlogPosts } from '@/lib/blogMarkdown'
import { getSiteUrl } from '@/lib/siteUrl'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const currentDate = new Date()

  const locales = ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'es', 'pt', 'fr', 'de', 'id', 'ar', 'ur', 'ja'] as const

  // Produce fully-qualified URLs with explicit locale segment for all languages.
  const withLocales = (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return locales.map((loc) => `${baseUrl}/${loc}${normalized === '/' ? '' : normalized}`)
  }

  const makeItem = (
    url: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
    lastModified: Date = currentDate
  ) => {
    return {
      url,
      lastModified,
      changeFrequency,
      priority,
    } satisfies MetadataRoute.Sitemap[number]
  }

  const staticLocalizedPages: MetadataRoute.Sitemap = [
    ...withLocales('/').map((url) => makeItem(url, 'daily', url === baseUrl ? 1 : 0.8)),
    ...withLocales('/about').map((url) => makeItem(url, 'monthly', 0.7)),
    ...withLocales('/contact').map((url) => makeItem(url, 'monthly', 0.6)),
    ...withLocales('/blog').map((url) => makeItem(url, 'weekly', 0.8)),
    ...withLocales('/popular').map((url) => makeItem(url, 'daily', 0.9)),
    ...withLocales('/pricing').map((url) => makeItem(url, 'monthly', 0.4)),
    ...withLocales('/privacy').map((url) => makeItem(url, 'yearly', 0.3)),
    ...withLocales('/terms').map((url) => makeItem(url, 'yearly', 0.3)),
  ]

  // Build category and calculator pages from the canonical toolsData hierarchy.
  const categoryPages: MetadataRoute.Sitemap = Object.entries(toolsData).flatMap(([categoryId, category]) =>
    // category index page
    withLocales(`/${categoryId}`).map((url) => ({
      url,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  )

  // For calculators, only include those that are present in toolsData (valid hierarchy).
  const calculatorPages: MetadataRoute.Sitemap = Object.entries(toolsData).flatMap(([categoryId, category]) =>
    Object.values(category.subcategories ?? {}).flatMap((sub) =>
      (sub.calculators ?? []).flatMap((tool) =>
        withLocales(`/${categoryId}/${tool.id}`).map((url) => ({
          url,
          lastModified: currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      )
    )
  )

  const markdownBlogPages: MetadataRoute.Sitemap = getAllMarkdownBlogPosts().flatMap((post) => {
    const lastModified = new Date(post.frontmatter.updatedAt ?? post.frontmatter.publishedAt ?? currentDate)
    return withLocales(`/blog/${post.slug}`).map((url) => ({
      url,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))
  })

  const blogPages: MetadataRoute.Sitemap = allBlogPosts.flatMap((post) => {
    const lastModified = new Date(post.updatedAt ?? post.publishedAt)
    const priority = post.featured ? 0.7 : 0.5
    return withLocales(`/blog/${post.slug}`).map((url) => ({
      url,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority,
    }))
  })

  // Fetch db posts securely handling potential timeouts
  let dbBlogPages: MetadataRoute.Sitemap = []
  try {
    const dbPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true }
    });
    
    dbBlogPages = dbPosts.flatMap((post) => {
      const lastModified = new Date(post.updatedAt)
      const priority = 0.5
      return withLocales(`/blog/${post.slug}`).map((url) => ({
        url,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority,
      }))
    })
  } catch (error) {
    console.warn("DB not ready during static sitemap generation, skipping db posts.")
  }

  // De-dupe (defensive)
  const all = [...staticLocalizedPages, ...categoryPages, ...calculatorPages, ...blogPages, ...markdownBlogPages, ...dbBlogPages]
  const seen = new Set<string>()
  return all.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}
