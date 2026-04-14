import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Params { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only SUPER_ADMIN can edit revenue." }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { source, amount, currency, month, year, notes } = body

    const revenue = await prisma.revenue.update({
      where: { id },
      data: {
        ...(source !== undefined && { source }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency !== undefined && { currency }),
        ...(month !== undefined && { month: parseInt(month) }),
        ...(year !== undefined && { year: parseInt(year) }),
        ...(notes !== undefined && { notes }),
      }
    })

    return NextResponse.json(revenue)
  } catch (error: any) {
    console.error("Revenue update error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Record for this source and time period already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update revenue record" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only SUPER_ADMIN can delete revenue." }, { status: 401 })
    }

    const { id } = await params

    await prisma.revenue.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revenue delete error:", error)
    return NextResponse.json({ error: "Failed to delete revenue record" }, { status: 500 })
  }
}
