import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/subscribers — List all newsletter subscribers
 */
export async function GET() {
  try {
    const subscribers = await prisma.newsletter.findMany({
      orderBy: { subscribedAt: "desc" },
    })
    
    return NextResponse.json({ subscribers })
  } catch (error) {
    console.error("Subscribers list error:", error)
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
  }
}
