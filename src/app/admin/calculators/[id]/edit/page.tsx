import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CalculatorEditorClient } from "@/components/admin/calculators/CalculatorEditorClient"

export default async function CalculatorEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/admin/login")
  }

  const { id } = await params

  // Fetch the calculator with translations and category
  const calculator = await prisma.calculator.findUnique({
    where: { id },
    include: {
      translations: true,
      category: true,
    },
  })

  if (!calculator) {
    return (
      <div style={{ color: "#e2e8f0", padding: "40px", textAlign: "center" }}>
        <h2>Calculator not found</h2>
        <p>The calculator you are trying to edit does not exist.</p>
      </div>
    )
  }

  // Categories list for select
  const categoriesBase = await prisma.category.findMany()
  const categories = categoriesBase.map(c => ({ id: c.id, name: c.name, slug: c.slug }))

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px 0" }}>
        Edit Calculator: {calculator.id}
      </h2>
      <CalculatorEditorClient calculator={calculator as any} categories={categories} />
    </div>
  )
}
