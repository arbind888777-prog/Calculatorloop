import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all English calculator translations for bulk editing
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const lang = url.searchParams.get("lang") || "en"

    const data = await prisma.calculatorTranslation.findMany({
      where: { language: lang },
      include: {
        calculator: {
          select: { slug: true }
        }
      },
      orderBy: { calculator: { slug: "asc" } }
    })

    return NextResponse.json({ translations: data })
  } catch (error) {
    console.error("GET Bulk Meta error:", error)
    return NextResponse.json({ error: "Failed to fetch bulk meta" }, { status: 500 })
  }
}

// Bulk update metaTitle and metaDesc for translations
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { updates } = body // Array of { id, metaTitle, metaDesc }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates must be an array" }, { status: 400 })
    }

    const results = [];
    // Using simple loop as SQLite/some drivers might not support complex bulk upserts with unique schema constraints
    for (const update of updates) {
      if (!update.id) continue;
      
      const res = await prisma.calculatorTranslation.update({
        where: { id: update.id },
        data: {
          metaTitle: update.metaTitle || null,
          metaDesc: update.metaDesc || null
        }
      })
      results.push(res.id)
    }

    return NextResponse.json({ success: true, updatedCount: results.length })
  } catch (error) {
    console.error("PUT Bulk Meta error:", error)
    return NextResponse.json({ error: "Failed to bulk update meta" }, { status: 500 })
  }
}
