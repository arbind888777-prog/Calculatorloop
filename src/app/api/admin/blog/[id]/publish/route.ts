import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/blog/[id]/publish — Publish blog post + trigger ISR revalidation
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response
    const session = guard.session

    const { id } = await params

    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: { translations: true },
    })

    if (!blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    // Update blog status to PUBLISHED
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { status: "PUBLISHED" },
    })

    // Update all translations: set isPublished=true and publishedAt
    await prisma.blogPostTranslation.updateMany({
      where: { blogPostId: id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    // Trigger ISR revalidation for each language version
    const revalidationSecret = process.env.REVALIDATION_SECRET
    if (revalidationSecret) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      for (const translation of blogPost.translations) {
        try {
          await fetch(
            `${baseUrl}/api/revalidate?path=/${translation.language}/blog/${translation.urlSlug}&secret=${revalidationSecret}`,
            { method: "POST" }
          )
        } catch (revalError) {
          console.warn(`ISR revalidation failed for ${translation.urlSlug}:`, revalError)
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "blog_published",
        entityType: "BlogPost",
        entityId: id,
        details: JSON.stringify({ slug: updated.slug }),
      },
    })

    return NextResponse.json({
      message: "Blog post published successfully",
      blogPost: updated,
    })
  } catch (error) {
    console.error("Blog publish error:", error)
    return NextResponse.json(
      { error: "Failed to publish blog post" },
      { status: 500 }
    )
  }
}
