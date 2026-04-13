import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await req.json()
    const { keyword, targetUrl, volume, currentRank } = body

    const existing = await prisma.sEOKeyword.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.sEOKeyword.update({
      where: { id },
      data: {
        keyword: keyword !== undefined ? keyword : existing.keyword,
        targetUrl: targetUrl !== undefined ? targetUrl : existing.targetUrl,
        volume: volume !== undefined ? Number(volume) : existing.volume,
        previousRank: currentRank !== undefined && currentRank !== existing.currentRank ? existing.currentRank : existing.previousRank,
        currentRank: currentRank !== undefined ? Number(currentRank) : existing.currentRank
      }
    })

    return NextResponse.json({ keyword: updated })
  } catch (error) {
    console.error("PUT Keyword error:", error)
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("superadmin")
    if (!guard.ok) return guard.response

    const { id } = await params
    await prisma.sEOKeyword.delete({ where: { id } })
    return NextResponse.json({ message: "Keyword deleted" })
  } catch (error) {
    console.error("DELETE Keyword error:", error)
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
  }
}
