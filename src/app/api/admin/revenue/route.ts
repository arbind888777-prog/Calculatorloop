import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["SUPER_ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const where: any = {}
    if (year) where.year = parseInt(year)
    if (month) where.month = parseInt(month)

    const revenue = await prisma.revenue.findMany({
      where,
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
    })

    return NextResponse.json({ revenue })
  } catch (error) {
    console.error("Revenue list error:", error)
    return NextResponse.json({ error: "Failed to list revenue" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only SUPER_ADMIN can add revenue." }, { status: 401 })
    }

    const body = await request.json()
    const { source, amount, currency, month, year, notes } = body

    if (!source || amount === undefined || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const revenue = await prisma.revenue.create({
      data: {
        source,
        amount: parseFloat(amount),
        currency: currency || "USD",
        month: parseInt(month),
        year: parseInt(year),
        notes,
      }
    })

    return NextResponse.json(revenue)
  } catch (error: any) {
    console.error("Revenue create error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Record for this source and time period already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create revenue record" }, { status: 500 })
  }
}
