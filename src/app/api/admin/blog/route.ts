import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

type BlogPayload = {
  slug?: string
  category?: string | null
  subcategory?: string | null
  linkedCalculatorId?: string | null
  featuredImage?: string | null
  tags?: string[]
  status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "SCHEDULED"
  scheduledAt?: string | null
  translations?: Array<{
    language: string
    title: string
    content?: string
    metaTitle?: string
    metaDesc?: string
    urlSlug?: string
    isPublished?: boolean
    wordCount?: number
  }>
}

function normalizeSlug(value?: string | null) {
  if (!value) return ""

  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function generateUniqueBlogSlug(baseSlug: string) {
  const normalizedBase = normalizeSlug(baseSlug)
  let candidate = normalizedBase
  let suffix = 2

  if (!candidate) {
    candidate = `post-${Date.now()}`
  }

  while (await prisma.blogPost.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${normalizedBase}-${suffix}`
    suffix += 1
  }

  return candidate
}

async function generateUniqueTranslationSlug(baseSlug: string, reservedSlugs?: Set<string>) {
  const normalizedBase = normalizeSlug(baseSlug)
  let candidate = normalizedBase
  let suffix = 2

  if (!candidate) {
    candidate = `post-${Date.now()}`
  }

  while (
    reservedSlugs?.has(candidate) ||
    await prisma.blogPostTranslation.findUnique({ where: { urlSlug: candidate }, select: { id: true } })
  ) {
    candidate = `${normalizedBase}-${suffix}`
    suffix += 1
  }

  reservedSlugs?.add(candidate)
  return candidate
}

async function resolveLinkedCalculatorId(input?: string | null) {
  if (!input) return null

  const calculator = await prisma.calculator.findFirst({
    where: {
      OR: [
        { id: input },
        { slug: input },
      ],
    },
    select: { id: true },
  })

  return calculator?.id ?? null
}

function buildBlogSummary(posts: Array<{ status: string; category: string | null }>, total: number) {
  const summary = {
    total,
    published: 0,
    drafts: 0,
    review: 0,
    scheduled: 0,
    uncategorized: 0,
  }

  const categoryCounts: Record<string, number> = {}

  for (const post of posts) {
    if (post.status === "PUBLISHED") summary.published += 1
    if (post.status === "DRAFT") summary.drafts += 1
    if (post.status === "REVIEW") summary.review += 1
    if (post.status === "SCHEDULED") summary.scheduled += 1

    const categoryKey = post.category || "uncategorized"
    if (!post.category) summary.uncategorized += 1
    categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1
  }

  return {
    ...summary,
    topCategories: Object.entries(categoryCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count })),
  }
}

/**
 * GET /api/admin/blog — List blog posts with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const language = searchParams.get("language")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {}

    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        {
          translations: {
            some: { title: { contains: search, mode: "insensitive" } },
          },
        },
      ]
    }

    const [posts, total, statusRows] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: language
            ? { where: { language } }
            : { where: { language: "en" }, take: 1 },
          author: { select: { name: true, email: true } },
          calculator: { select: { slug: true, translations: { where: { language: 'en' }, select: { title: true } } } },
          _count: { select: { translations: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        select: { status: true, category: true },
      }),
    ])

    const summary = buildBlogSummary(statusRows, total)

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        category: p.category,
        subcategory: p.subcategory,
        linkedToolName: p.calculator?.translations?.[0]?.title || p.calculator?.slug || null,
        status: p.status,
        featuredImage: p.featuredImage,
        tags: p.tags,
        viewCount: p.viewCount,
        title: p.translations[0]?.title || p.slug,
        language: p.translations[0]?.language || "en",
        translationCount: p._count.translations,
        authorName: p.author?.name || p.author?.email || "Unknown",
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      summary,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Blog list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/blog — Create a new blog post
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response
    const session = guard.session

    const body = await request.json() as BlogPayload
    const {
      slug,
      category,
      subcategory,
      linkedCalculatorId,
      featuredImage,
      tags,
      status,
      scheduledAt,
      translations,
    } = body

    const requestedSlug = normalizeSlug(slug)

    if (!requestedSlug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      )
    }

    const finalSlug = await generateUniqueBlogSlug(requestedSlug)

    const validTranslations = []
    const reservedTranslationSlugs = new Set<string>()
    for (const translation of translations || []) {
      if (!translation?.title?.trim()) continue

      validTranslations.push({
        ...translation,
        title: translation.title.trim(),
        content: translation.content || "",
        metaTitle: translation.metaTitle || "",
        metaDesc: translation.metaDesc || "",
        urlSlug: await generateUniqueTranslationSlug(
          translation.urlSlug?.trim() || `${translation.language}-${finalSlug}`,
          reservedTranslationSlugs
        ),
        wordCount: translation.wordCount || 0,
        isPublished: translation.isPublished || false,
      })
    }

    if (validTranslations.length === 0) {
      return NextResponse.json(
        { error: "At least one language version with a title is required." },
        { status: 400 }
      )
    }

    const resolvedCalculatorId = await resolveLinkedCalculatorId(linkedCalculatorId)
    if (linkedCalculatorId && !resolvedCalculatorId) {
      return NextResponse.json(
        { error: "Linked calculator not found. Choose a valid calculator." },
        { status: 400 }
      )
    }

    const blogPost = await prisma.blogPost.create({
      data: {
        slug: finalSlug,
        category: category || null,
        subcategory: subcategory || null,
        linkedCalculatorId: resolvedCalculatorId,
        featuredImage: featuredImage || null,
        tags: tags || [],
        status: status || "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        authorId: session.user.id,
        translations: {
          create: validTranslations.map((t) => ({
            language: t.language,
            title: t.title,
            content: t.content,
            metaTitle: t.metaTitle,
            metaDesc: t.metaDesc,
            urlSlug: t.urlSlug,
            isPublished: t.isPublished,
            publishedAt: t.isPublished && (status || "DRAFT") === "PUBLISHED" ? new Date() : null,
            wordCount: t.wordCount,
          })),
        },
      },
      include: {
        translations: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "blog_created",
        entityType: "BlogPost",
        entityId: blogPost.id,
        details: JSON.stringify({ slug: finalSlug, status: status || "DRAFT" }),
      },
    })

    return NextResponse.json(
      {
        ...blogPost,
        requestedSlug,
        slugAdjusted: requestedSlug !== finalSlug,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Blog create error:", error)
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    )
  }
}
