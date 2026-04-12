import { NextResponse } from "next/server"

/**
 * POST /api/admin/seo/generate-sitemap — Trigger sitemap regeneration
 */
export async function POST() {
  try {
    // In Next.js App Router, the sitemap is auto-generated from /app/sitemap.ts
    // This endpoint triggers a revalidation of the sitemap path
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const secret = process.env.REVALIDATION_SECRET || ""

    await fetch(`${baseUrl}/api/revalidate?path=/sitemap.xml&secret=${secret}`, {
      method: "POST",
    }).catch(() => {})

    return NextResponse.json({
      message: "Sitemap regeneration triggered",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Sitemap generation error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
