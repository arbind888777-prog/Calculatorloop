import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/blog/[id] — Get single blog post with all translations
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
        author: { select: { name: true, email: true } },
        calculator: {
          select: { id: true, slug: true },
          // Include first EN translation for display name
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      slug,
      category,
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

    const blogPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(category !== undefined && { category }),
        ...(linkedCalculatorId !== undefined && { linkedCalculatorId: linkedCalculatorId || null }),
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
