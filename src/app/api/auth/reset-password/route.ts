import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, hashResetToken } from "@/lib/password"
import {
  resetPasswordSchema,
  validateAndSanitize,
} from "@/lib/security/validation"
import { sanitizeEmail } from "@/lib/security/sanitize"
import { sendPasswordChangedEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = validateAndSanitize(resetPasswordSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(validation.data.email)
    const token = hashResetToken(validation.data.token)
    const password = validation.data.password

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        }
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: email }
      }),
      prisma.session.deleteMany({
        where: { userId: user.id }
      }),
    ])

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "auth.password_reset_completed",
        entityType: "auth",
        details: JSON.stringify({ email }),
      },
    }).catch(() => null)

    await sendPasswordChangedEmail(email).catch((error) => {
      console.error("Password changed notification failed:", error)
      return null
    })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
