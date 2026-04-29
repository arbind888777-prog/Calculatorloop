import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params {
  params: Promise<{ id: string; lang: string }>
}

/**
 * PUT /api/admin/blog/[id]/translations/[lang] — Update a specific language translation
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const { id, lang } = await params
    const body = await request.json()
    const { title, content, metaTitle, metaDesc, urlSlug, isPublished, wordCount } = body
    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    const shouldSetPublishedAt = Boolean(isPublished && blogPost.status === "PUBLISHED")

    // Upsert: create if doesn't exist, update if it does
    const translation = await prisma.blogPostTranslation.upsert({
      where: {
        blogPostId_language: {
          blogPostId: id,
          language: lang,
        },
      },
      create: {
        blogPostId: id,
        language: lang,
        title: title || "",
        content: content || "",
        metaTitle: metaTitle || "",
        metaDesc: metaDesc || "",
        urlSlug: urlSlug || `${lang}-${id}`,
        isPublished: isPublished || false,
        publishedAt: shouldSetPublishedAt ? new Date() : null,
        wordCount: wordCount || 0,
      },
      update: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
        ...(urlSlug !== undefined && { urlSlug }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isPublished !== undefined && {
          publishedAt: shouldSetPublishedAt ? new Date() : null,
        }),
        ...(wordCount !== undefined && { wordCount }),
      },
    })

    return NextResponse.json(translation)
  } catch (error) {
    console.error("Translation update error:", error)
    return NextResponse.json(
      { error: "Failed to update translation" },
      { status: 500 }
    )
  }
}
