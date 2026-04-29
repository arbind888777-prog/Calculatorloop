import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requireAdmin } from "@/lib/adminGuard"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin("viewer")
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim()
    const maxResults = Math.min(parseInt(searchParams.get("limit") || "30", 10), 60)

    const expression = [
      "resource_type:image",
      "folder:calculatorloop/images",
      search ? `filename:*${search.replace(/[^\w-]/g, "")}*` : "",
    ].filter(Boolean).join(" AND ")

    const result = await cloudinary.search
      .expression(expression)
      .sort_by("created_at", "desc")
      .max_results(maxResults)
      .execute()

    return NextResponse.json({
      assets: (result.resources || []).map((asset: any) => ({
        id: asset.asset_id,
        publicId: asset.public_id,
        url: asset.secure_url,
        width: asset.width,
        height: asset.height,
        format: asset.format,
        bytes: asset.bytes,
        createdAt: asset.created_at,
      })),
    })
  } catch (error: any) {
    console.error("Media library error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to load media library" },
      { status: 500 }
    )
  }
}
