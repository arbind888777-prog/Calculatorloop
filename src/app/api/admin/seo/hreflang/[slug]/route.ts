import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params { params: Promise<{ slug: string }> }

const LANGUAGES = ["en", "hi", "es", "bn", "ta", "te", "mr"]
const SITE_URL = "https://calculatorloop.com"

/**
 * GET /api/admin/seo/hreflang/[slug] — Generate hreflang tags for a page
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const { slug } = await params

    // Check if it's a blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { slug },
      include: { translations: true },
    })

    let hreflangTags: string[] = []

    if (blogPost) {
      for (const translation of blogPost.translations) {
        if (translation.isPublished) {
          hreflangTags.push(
            `<link rel="alternate" hreflang="${translation.language}" href="${SITE_URL}/${translation.language}/blog/${translation.urlSlug}" />`
          )
        }
      }
      // x-default
      const enTranslation = blogPost.translations.find((t) => t.language === "en")
      if (enTranslation) {
        hreflangTags.push(
          `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/blog/${enTranslation.urlSlug}" />`
        )
      }
    } else {
      // Calculator or static page — generate for all supported languages
      for (const lang of LANGUAGES) {
        hreflangTags.push(
          `<link rel="alternate" hreflang="${lang}" href="${SITE_URL}/${lang}/calculator/${slug}" />`
        )
      }
      hreflangTags.push(
        `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/calculator/${slug}" />`
      )
    }

    return NextResponse.json({
      slug,
      type: blogPost ? "blog" : "calculator",
      html: hreflangTags.join("\n"),
      tags: hreflangTags,
    })
  } catch (error) {
    console.error("hreflang error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
