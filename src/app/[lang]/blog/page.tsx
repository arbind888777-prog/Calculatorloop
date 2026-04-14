import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Metadata } from "next"

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return {
    title: `Blog — CalculatorLoop`,
    description: `Read our latest guides, tutorials, and tips about calculators and tools.`,
    alternates: {
      languages: {
        en: "/en/blog",
        hi: "/hi/blog",
        es: "/es/blog",
      },
    },
  }
}

export default async function BlogListingPage({ params }: Props) {
  const { lang } = await params
  const language = lang || "en"

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
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
    orderBy: { updatedAt: "desc" },
    take: 30,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans min-h-screen">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Calculators <span className="text-primary">Blog</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Deep dives, tutorials, and expert guides to help you make the most out of our tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          const t = post.translations[0]
          if (!t) return null
          return (
            <Link
              key={post.id}
              href={`/${language}/blog/${t.urlSlug}`}
              className="group flex flex-col glass-effect rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50"
            >
              {post.featuredImage ? (
                <div className="relative w-full h-48 overflow-hidden bg-muted">
                  <img
                    src={post.featuredImage}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className="w-full h-48 bg-secondary flex items-center justify-center border-b border-border">
                  <span className="text-4xl">📝</span>
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-1">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full w-fit mb-4">
                  {post.category || "General"}
                </span>
                
                <h2 className="text-xl font-bold mb-3 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {t.title}
                </h2>
                
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {t.metaDesc || t.content?.replace(/<[^>]*>/g, "").slice(0, 150) + "..."}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground/80 mt-auto pt-4 border-t border-border/50">
                  <span>{t.wordCount} words</span>
                  <time>{post.updatedAt.toLocaleDateString()}</time>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-24 glass-effect rounded-2xl border border-dashed border-border">
          <p className="text-xl text-muted-foreground">
            No blog posts available in this language yet.
          </p>
        </div>
      )}
    </div>
  )
}

export const revalidate = 3600
