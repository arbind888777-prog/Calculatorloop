import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

/**
 * GET /api/admin/calculators — List calculators with pagination + filters
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 50)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const selectedId = searchParams.get("selectedId")

    const where: any = {}

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { translations: { some: { title: { contains: search, mode: "insensitive" } } } },
      ]
    }
    if (category) where.category = { slug: category }
    if (status === "active") where.isActive = true
    if (status === "inactive") where.isActive = false

    const [calculators, total, selectedCalculator] = await Promise.all([
      prisma.calculator.findMany({
        where,
        include: {
          translations: { where: { language: "en" }, take: 1 },
          category: { select: { name: true, slug: true } },
          _count: { select: { translations: true } },
        },
        orderBy: { totalUses: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.calculator.count({ where }),
      selectedId
        ? prisma.calculator.findUnique({
            where: { id: selectedId },
            include: {
              translations: { where: { language: "en" }, take: 1 },
              category: { select: { name: true, slug: true } },
              _count: { select: { translations: true } },
            },
          })
        : Promise.resolve(null),
    ])

    const mappedCalculators = calculators.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.translations[0]?.title || c.slug,
      category: c.category?.name || "",
      totalUses: c.totalUses,
      isActive: c.isActive,
      languageCount: c._count.translations,
    }))

    if (selectedCalculator && !mappedCalculators.some((calculator) => calculator.id === selectedCalculator.id)) {
      mappedCalculators.unshift({
        id: selectedCalculator.id,
        slug: selectedCalculator.slug,
        name: selectedCalculator.translations[0]?.title || selectedCalculator.slug,
        category: selectedCalculator.category?.name || "",
        totalUses: selectedCalculator.totalUses,
        isActive: selectedCalculator.isActive,
        languageCount: selectedCalculator._count.translations,
      })
    }

    return NextResponse.json({
      calculators: mappedCalculators,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Calculator list error:", error)
    return NextResponse.json({ error: "Failed to fetch calculators" }, { status: 500 })
  }
}
