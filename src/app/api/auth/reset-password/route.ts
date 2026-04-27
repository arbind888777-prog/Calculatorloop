import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json()

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    if (verificationToken.expires < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } }
    })

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
