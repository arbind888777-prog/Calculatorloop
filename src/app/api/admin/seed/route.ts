import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

/**
 * POST /api/admin/seed
 * Creates the first SUPER_ADMIN user. Only works if no admin user exists yet.
 * Disabled in production unless SEED_SECRET env is set and passed as Authorization header.
 *
 * Body: { email: string, password: string, name?: string }
 */
export async function POST(request: Request) {
  try {
    // Block in production unless SEED_SECRET is configured
    if (process.env.NODE_ENV === "production") {
      const seedSecret = process.env.SEED_SECRET
      if (!seedSecret) {
        return NextResponse.json(
          { error: "Seed endpoint is disabled in production." },
          { status: 403 }
        )
      }
      const authHeader = request.headers.get("Authorization")
      if (authHeader !== `Bearer ${seedSecret}`) {
        return NextResponse.json(
          { error: "Invalid seed secret." },
          { status: 401 }
        )
      }
    }
    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: { in: ["SUPER_ADMIN", "EDITOR"] },
      },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin user already exists. Seed is disabled." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Promote existing user to SUPER_ADMIN
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: "SUPER_ADMIN" },
      })

      return NextResponse.json({
        message: "Existing user promoted to SUPER_ADMIN.",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      })
    }

    // Create new SUPER_ADMIN user
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || "Admin",
        role: "SUPER_ADMIN",
      },
    })

    return NextResponse.json({
      message: "SUPER_ADMIN user created successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Internal server error during seeding." },
      { status: 500 }
    )
  }
}
