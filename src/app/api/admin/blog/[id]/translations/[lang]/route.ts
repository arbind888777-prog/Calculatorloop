import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string; lang: string }>
}

/**
 * PUT /api/admin/blog/[id]/translations/[lang] — Update a specific language translation
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, lang } = await params
    const body = await request.json()
    const { title, content, metaTitle, metaDesc, urlSlug, isPublished, wordCount } = body

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
        publishedAt: isPublished ? new Date() : null,
        wordCount: wordCount || 0,
      },
      update: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
        ...(urlSlug !== undefined && { urlSlug }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isPublished && { publishedAt: new Date() }),
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
