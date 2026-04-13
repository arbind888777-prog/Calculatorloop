import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { requireAdmin } from "@/lib/adminGuard"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/admin/upload — Upload images/videos to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, WebM" },
        { status: 400 }
      )
    }

    // Max file size: 10MB for images, 50MB for videos
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxMB}MB` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using a Promise wrapper over the stream
    const result = await new Promise<any>((resolve, reject) => {
      const resourceType = file.type.startsWith("video/") ? "video" : "image"
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `calculatorloop/${resourceType}s`,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      filename: result.public_id,
      size: result.bytes,
      type: file.type,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to upload file to Cloudinary" },
      { status: 500 }
    )
  }
}
