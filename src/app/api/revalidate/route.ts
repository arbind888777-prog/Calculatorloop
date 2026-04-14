import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * POST /api/revalidate — On-demand ISR revalidation
 * Usage: POST /api/revalidate?path=/en/blog/my-post&secret=YOUR_SECRET
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const pathToRevalidate = searchParams.get("path")

  // Validate secret
  const expectedSecret = process.env.REVALIDATION_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
  }

  if (!pathToRevalidate) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    )
  }

  try {
    revalidatePath(pathToRevalidate)
    return NextResponse.json({
      revalidated: true,
      path: pathToRevalidate,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    )
  }
}
