import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const calculator = await prisma.calculator.findUnique({
      where: { id },
      include: {
        translations: true,
        category: true,
        blogPosts: {
          include: { translations: { where: { language: "en" }, take: 1 } },
          take: 5,
        },
      },
    })
    if (!calculator) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(calculator)
  } catch (error) {
    console.error("Calculator get error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { slug, categoryId, subcategory, isActive, isFeatured } = body

    const calculator = await prisma.calculator.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(subcategory !== undefined && { subcategory }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
      include: { translations: true },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "calculator_updated",
        entityType: "Calculator",
        entityId: id,
        details: JSON.stringify({ slug: calculator.slug }),
      },
    })

    return NextResponse.json(calculator)
  } catch (error) {
    console.error("Calculator update error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
