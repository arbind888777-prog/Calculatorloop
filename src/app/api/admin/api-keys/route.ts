import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { requireAdmin } from "@/lib/adminGuard"

/**
 * GET /api/admin/api-keys — List all admin API keys
 */
export async function GET() {
  try {
    const guard = await requireAdmin("superadmin")
    if (!guard.ok) return guard.response

    const keys = await prisma.adminApiKey.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({
      keys: keys.map((k) => ({
        id: k.id,
        clientName: k.clientName,
        plan: k.plan,
        callsLimit: k.callsLimit,
        callsUsed: k.callsUsed,
        isActive: k.isActive,
        createdAt: k.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("API keys list error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

/**
 * POST /api/admin/api-keys — Generate a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("superadmin")
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { clientName, plan } = body

    if (!clientName) {
      return NextResponse.json({ error: "Client name required" }, { status: 400 })
    }

    // Generate a secure random key
    const rawKey = `cl_${plan?.toLowerCase() || "free"}_${crypto.randomBytes(24).toString("hex")}`
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

    // Plan limits
    const planLimits: Record<string, number> = {
      FREE: 100,
      STARTER: 10000,
      PRO: 100000,
      ENTERPRISE: 999999999,
    }

    await prisma.adminApiKey.create({
      data: {
        clientName,
        keyHash,
        plan: (plan as any) || "FREE",
        callsLimit: planLimits[plan] || 100,
      },
    })

    // Return the raw key — it's only shown once
    return NextResponse.json({ key: rawKey, message: "API key created" })
  } catch (error) {
    console.error("API key create error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
