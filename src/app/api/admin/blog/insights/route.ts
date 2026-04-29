import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminGuard"
import { prisma } from "@/lib/prisma"
import { buildAdminBlogInsights } from "@/lib/adminBlogInsights"

export async function GET() {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const posts = await prisma.blogPost.findMany({
      select: {
        linkedCalculatorId: true,
        status: true,
        tags: true,
      },
    })

    const insights = buildAdminBlogInsights(posts)
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Blog insights error:", error)
    return NextResponse.json({ error: "Failed to fetch blog insights" }, { status: 500 })
  }
}
