import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/blog — List blog posts with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
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

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: language
            ? { where: { language } }
            : { where: { language: "en" }, take: 1 },
          author: { select: { name: true, email: true } },
          _count: { select: { translations: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        category: p.category,
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      slug,
      category,
      linkedCalculatorId,
      featuredImage,
      tags,
      status,
      scheduledAt,
      translations,
    } = body

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: "A blog post with this slug already exists" },
        { status: 409 }
      )
    }

    const blogPost = await prisma.blogPost.create({
      data: {
        slug,
        category: category || null,
        linkedCalculatorId: linkedCalculatorId || null,
        featuredImage: featuredImage || null,
        tags: tags || [],
        status: status || "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        authorId: session.user.id,
        translations: {
          create: (translations || []).map((t: any) => ({
            language: t.language,
            title: t.title || "",
            content: t.content || "",
            metaTitle: t.metaTitle || "",
            metaDesc: t.metaDesc || "",
            urlSlug: t.urlSlug || `${t.language}-${slug}`,
            isPublished: t.isPublished || false,
            publishedAt: t.isPublished ? new Date() : null,
            wordCount: t.wordCount || 0,
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
        details: JSON.stringify({ slug, status: status || "DRAFT" }),
      },
    })

    return NextResponse.json(blogPost, { status: 201 })
  } catch (error) {
    console.error("Blog create error:", error)
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    )
  }
}
