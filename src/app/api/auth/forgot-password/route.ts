import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"
import { normalizeSiteUrl } from "@/lib/siteUrl"
import {
  forgotPasswordSchema,
  validateAndSanitize,
} from "@/lib/security/validation"
import { getClientIdentifier, withRateLimit } from "@/lib/security/rateLimit"
import { sanitizeEmail } from "@/lib/security/sanitize"
import { hashResetToken } from "@/lib/password"

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists, a password reset link will be sent to your email."

export async function POST(req: Request) {
  try {
    const clientId = getClientIdentifier(req)
    const body = await req.json()
    const validation = validateAndSanitize(forgotPasswordSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(validation.data.email)
    const rateLimit = withRateLimit(`${email}:${clientId}`, "passwordReset")

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // We return ok even if user doesn't exist to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE })
    }

    const token = randomBytes(32).toString("hex")
    const hashedToken = hashResetToken(token)
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour expiration

    // Remove existing tokens for this email if any
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires
      }
    })

    const baseUrl = normalizeSiteUrl(
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
    )
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    const emailResult = await sendPasswordResetEmail(email, resetLink)

    if (!emailResult.success) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: email, token: hashedToken },
      }).catch(() => null)
      console.error("Password reset email delivery failed for:", email)
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "auth.password_reset_requested",
        entityType: "auth",
        details: JSON.stringify({ email }),
      },
    }).catch(() => null)

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
