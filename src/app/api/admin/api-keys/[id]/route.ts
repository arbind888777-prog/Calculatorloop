import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params { params: Promise<{ id: string }> }

/**
 * DELETE /api/admin/api-keys/[id] — Revoke an API key
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("superadmin")
    if (!guard.ok) return guard.response

    const { id } = await params
    await prisma.adminApiKey.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ message: "API key revoked" })
  } catch (error) {
    console.error("API key revoke error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
