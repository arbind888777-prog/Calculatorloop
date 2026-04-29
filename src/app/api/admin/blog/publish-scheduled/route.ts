import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

function hasValidSecret(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET || process.env.REVALIDATION_SECRET
  if (!configuredSecret) return false

  const auth = request.headers.get("authorization")
  const headerSecret = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null
  const querySecret = new URL(request.url).searchParams.get("secret")

  return headerSecret === configuredSecret || querySecret === configuredSecret
}

async function revalidatePublishedPaths(translations: Array<{ language: string; urlSlug: string }>) {
  const revalidationSecret = process.env.REVALIDATION_SECRET
  if (!revalidationSecret) return

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  await Promise.allSettled(
    translations.map((translation) =>
      fetch(
        `${baseUrl}/api/revalidate?path=/${translation.language}/blog/${translation.urlSlug}&secret=${revalidationSecret}`,
        { method: "POST" }
      )
    )
  )
}

async function publishDuePosts() {
  const duePosts = await prisma.blogPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
      translations: {
        some: { isPublished: true },
      },
    },
    include: {
      translations: {
        where: { isPublished: true },
        select: { id: true, language: true, urlSlug: true, publishedAt: true },
      },
    },
    take: 25,
    orderBy: { scheduledAt: "asc" },
  })

  const published = []

  for (const post of duePosts) {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { status: "PUBLISHED", scheduledAt: null },
    })

    await prisma.blogPostTranslation.updateMany({
      where: {
        blogPostId: post.id,
        isPublished: true,
        publishedAt: null,
      },
      data: { publishedAt: new Date() },
    })

    await prisma.activityLog.create({
      data: {
        action: "blog_scheduled_published",
        entityType: "BlogPost",
        entityId: post.id,
        details: JSON.stringify({ slug: post.slug, scheduledAt: post.scheduledAt }),
      },
    })

    await revalidatePublishedPaths(post.translations)

    published.push({
      id: post.id,
      slug: post.slug,
      languages: post.translations.map((translation) => translation.language),
    })
  }

  return published
}

export async function POST(request: NextRequest) {
  try {
    if (!hasValidSecret(request)) {
      const guard = await requireAdmin("editor")
      if (!guard.ok) return guard.response
    }

    const published = await publishDuePosts()
    return NextResponse.json({ success: true, publishedCount: published.length, published })
  } catch (error) {
    console.error("Scheduled blog publish error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to publish scheduled blog posts" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
