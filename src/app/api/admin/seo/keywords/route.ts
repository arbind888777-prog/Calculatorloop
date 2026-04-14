import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

export async function GET() {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const keywords = await prisma.sEOKeyword.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ keywords })
  } catch (error) {
    console.error("GET Keywords error:", error)
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const body = await req.json()
    const { keyword, targetUrl, volume, currentRank } = body

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    const created = await prisma.sEOKeyword.create({
      data: {
        keyword,
        targetUrl,
        volume: Number(volume) || 0,
        currentRank: currentRank ? Number(currentRank) : null
      }
    })

    return NextResponse.json({ keyword: created })
  } catch (error) {
    console.error("POST Keywords error:", error)
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 })
  }
}
