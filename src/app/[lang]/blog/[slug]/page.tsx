import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import Link from "next/link"

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateStaticParams() {
  const translations = await prisma.blogPostTranslation.findMany({
    where: { isPublished: true },
    select: { language: true, urlSlug: true },
  }).catch(() => [])

  return translations.map((t) => ({
    lang: t.language,
    slug: t.urlSlug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params

  const translation = await prisma.blogPostTranslation.findUnique({
    where: { urlSlug: slug },
    include: {
      blogPost: {
        include: { translations: { select: { language: true, urlSlug: true } } },
      },
    },
  })

  if (!translation) return { title: "Not Found" }

  const alternates: Record<string, string> = {}
  for (const t of translation.blogPost.translations) {
    alternates[t.language] = `/${t.language}/blog/${t.urlSlug}`
  }

  return {
    title: translation.metaTitle || translation.title,
    description: translation.metaDesc || "",
    openGraph: {
      title: translation.metaTitle || translation.title,
      description: translation.metaDesc || "",
      type: "article",
      publishedTime: translation.publishedAt?.toISOString(),
      locale: lang,
      url: `https://calculatorloop.com/${lang}/blog/${slug}`,
    },
    alternates: { languages: alternates },
  }
}

function sanitizeHtml(html: string): string {
  try {
    const window = new JSDOM("").window
    const purify = DOMPurify(window as any)
    return purify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "loading", "class", "style"],
    })
  } catch {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { lang, slug } = await params

  const translation = await prisma.blogPostTranslation.findUnique({
    where: { urlSlug: slug },
    include: {
      blogPost: {
        include: {
          author: { select: { name: true } },
          translations: {
            select: { language: true, urlSlug: true, title: true },
          },
          calculator: {
            include: { 
              translations: { where: { language: lang }, take: 1 },
              category: true
            },
          },
        },
      },
    },
  })

  if (!translation || !translation.isPublished) {
    notFound()
  }

  const post = translation.blogPost
  const cleanContent = sanitizeHtml(translation.content)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: translation.metaTitle || translation.title,
    description: translation.metaDesc || "",
    author: {
      "@type": "Person",
      name: post.author?.name || "CalculatorLoop",
    },
    datePublished: translation.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      name: "CalculatorLoop",
      url: "https://calculatorloop.com",
    },
    mainEntityOfPage: `https://calculatorloop.com/${lang}/blog/${slug}`,
    inLanguage: lang,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://calculatorloop.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: `https://calculatorloop.com/${lang}/blog` },
      { "@type": "ListItem", position: 3, name: translation.title },
    ],
  }

  prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  // Calculate read time roughly
  const readTimeMins = Math.max(1, Math.ceil(translation.wordCount / 200));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-background text-foreground pb-20">
        {/* Hero Section */}
        <div className="w-full bg-secondary/50 border-b border-border pt-12 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="text-sm text-muted-foreground mb-8 flex items-center space-x-2">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/${lang}/blog`} className="hover:text-primary transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-foreground truncate max-w-[200px] md:max-w-none">{translation.title}</span>
            </nav>

            {/* Category */}
            {post.category && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                {post.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-8">
              {translation.title}
            </h1>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent-purple flex items-center justify-center text-white font-bold">
                  {(post.author?.name || "C")[0]}
                </div>
                <span className="font-medium text-foreground">{post.author?.name || "CalculatorLoop Team"}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <time>{translation.publishedAt?.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}</time>
              <span className="hidden sm:inline">•</span>
              <span>{readTimeMins} min read</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <article className="max-w-4xl mx-auto px-4 mt-12">
          {post.featuredImage && (
            <div className="w-full h-auto md:h-96 rounded-2xl overflow-hidden mb-12 shadow-lg border border-border">
              <img src={post.featuredImage} alt={translation.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Prose body */}
          <div 
            className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          {/* Linked Calculator CTA */}
          {post.calculator && (
            <div className="mt-16 p-8 glass-effect rounded-2xl border-l-4 border-l-primary shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Try Our {post.calculator.translations[0]?.title || post.calculator.slug}</h3>
                <p className="text-muted-foreground">Put this guide into practice with our free, interactive tool.</p>
              </div>
              <Link 
                href={`/${post.calculator.category?.slug || 'calculator'}/${post.calculator.slug}`}
                className="whitespace-nowrap px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md"
              >
                Use Calculator Now
              </Link>
            </div>
          )}

          {/* Language Maps */}
          {post.translations.length > 1 && (
            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-sm font-semibold mb-4 text-muted-foreground">Read this article in other languages:</p>
              <div className="flex flex-wrap gap-3">
                {post.translations.map((t) => (
                  <Link
                    key={t.language}
                    href={`/${t.language}/blog/${t.urlSlug}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      t.language === lang 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                  >
                    {t.language.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  )
}

export const revalidate = 3600
