import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"
import { normalizeSiteUrl } from "@/lib/siteUrl"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    
    // We return ok even if user doesn't exist to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a password reset link will be sent to your email." })
    }

    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour expiration

    // Remove existing tokens for this email if any
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    })

    const baseUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    
    await sendPasswordResetEmail(email, resetLink)

    return NextResponse.json({ message: "If an account exists, a password reset link will be sent to your email." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
