import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params {
  params: Promise<{ id: string }>
}

type BlogUpdatePayload = {
  slug?: string
  category?: string | null
  subcategory?: string | null
  linkedCalculatorId?: string | null
  featuredImage?: string | null
  tags?: string[]
  status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "SCHEDULED"
  scheduledAt?: string | null
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

/**
 * GET /api/admin/blog/[id] — Get single blog post with all translations
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const { id } = await params

    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
        author: { select: { name: true, email: true } },
        calculator: {
          select: { 
            id: true, 
            slug: true,
            translations: { where: { language: 'en' }, select: { title: true } }
          },
        },
      },
    })

    if (!blogPost) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    return NextResponse.json(blogPost)
  } catch (error) {
    console.error("Blog get error:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/blog/[id] — Update a blog post
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response
    const session = guard.session

    const { id } = await params
    const body = await request.json() as BlogUpdatePayload
    const {
      slug,
      category,
      subcategory,
      linkedCalculatorId,
      featuredImage,
      tags,
      status,
      scheduledAt,
    } = body

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    const normalizedSlug = slug?.trim()
    if (normalizedSlug && normalizedSlug !== existing.slug) {
      const duplicate = await prisma.blogPost.findUnique({ where: { slug: normalizedSlug } })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: "A blog post with this slug already exists" }, { status: 409 })
      }
    }

    const resolvedCalculatorId = linkedCalculatorId === undefined
      ? undefined
      : await resolveLinkedCalculatorId(linkedCalculatorId)

    if (linkedCalculatorId !== undefined && linkedCalculatorId && !resolvedCalculatorId) {
      return NextResponse.json(
        { error: "Linked calculator not found. Choose a valid calculator." },
        { status: 400 }
      )
    }

    const blogPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug: normalizedSlug || existing.slug }),
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory }),
        ...(linkedCalculatorId !== undefined && { linkedCalculatorId: resolvedCalculatorId || null }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && { status }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
      },
      include: { translations: true },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "blog_updated",
        entityType: "BlogPost",
        entityId: blogPost.id,
        details: JSON.stringify({ slug: blogPost.slug }),
      },
    })

    return NextResponse.json(blogPost)
  } catch (error) {
    console.error("Blog update error:", error)
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/blog/[id] — Delete a blog post
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response
    const session = guard.session

    const { id } = await params

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    await prisma.blogPost.delete({ where: { id } })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "blog_deleted",
        entityType: "BlogPost",
        entityId: id,
        details: JSON.stringify({ slug: existing.slug }),
      },
    })

    return NextResponse.json({ message: "Blog post deleted" })
  } catch (error) {
    console.error("Blog delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
}
