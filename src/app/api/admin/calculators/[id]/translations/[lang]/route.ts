import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params { params: Promise<{ id: string; lang: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const { id, lang } = await params
    const body = await request.json()
    const { title, description, metaTitle, metaDesc } = body

    const translation = await prisma.calculatorTranslation.upsert({
      where: {
        calculatorId_language: {
          calculatorId: id,
          language: lang,
        },
      },
      update: {
        title,
        description,
        metaTitle,
        metaDesc,
      },
      create: {
        calculatorId: id,
        language: lang,
        title,
        description,
        metaTitle,
        metaDesc,
      },
    })

    return NextResponse.json(translation)
  } catch (error) {
    console.error("Calculator translation update error:", error)
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 })
  }
}
