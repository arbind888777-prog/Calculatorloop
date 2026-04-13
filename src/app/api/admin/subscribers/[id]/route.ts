import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

interface Params { params: Promise<{ id: string }> }

/**
 * PUT /api/admin/subscribers/[id] — Toggle active status
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()
    const { active } = body

    const updated = await prisma.newsletter.update({
      where: { id },
      data: { active },
    })
    
    return NextResponse.json({ subscriber: updated })
  } catch (error) {
    console.error("Subscriber update error:", error)
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/subscribers/[id] — Delete a subscriber
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const guard = await requireAdmin("superadmin")
    if (!guard.ok) return guard.response

    const { id } = await params
    await prisma.newsletter.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Subscriber deleted" })
  } catch (error) {
    console.error("Subscriber delete error:", error)
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 })
  }
}
