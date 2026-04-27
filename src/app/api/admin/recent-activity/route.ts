import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminGuard"

export async function GET() {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const activities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(
      activities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        userName: a.user?.name || a.user?.email || "System",
        createdAt: a.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("Recent activity error:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
