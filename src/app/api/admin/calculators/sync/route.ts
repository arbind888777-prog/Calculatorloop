import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminGuard"
import { prisma } from "@/lib/prisma"
import { toolsData } from "@/lib/toolsData"
import { slugify } from "@/lib/utils" // Assume there's a slugify, or we can use the keys directly

export async function POST(req: Request) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    let count = 0

    // For each Category in toolsData
    for (const [categoryKey, categoryObject] of Object.entries(toolsData)) {
      // Create or find category
      let categorySlug = categoryKey
      
      const categoryName = "Calculators" // We can try to derive a good name, but toolsData doesn't have a top level name for all of them except what's hardcoded in the loop, let's use the key for now and Capitalize it
      const derivedCategoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace("-", " ")

      const existingCategory = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: { name: derivedCategoryName },
        create: {
          slug: categorySlug,
          name: derivedCategoryName,
          description: `Category for ${derivedCategoryName}`,
        }
      })

      // Go through subcategories
      for (const [subKey, subcategory] of Object.entries(categoryObject.subcategories)) {
        for (const tool of subcategory.calculators) {
          const calculatorSlug = tool.id
          
          await prisma.calculator.upsert({
            where: { slug: calculatorSlug },
            update: {
              categoryId: existingCategory.id,
              subcategory: subcategory.name,
            },
            create: {
              slug: calculatorSlug,
              categoryId: existingCategory.id,
              subcategory: subcategory.name,
              isActive: true,
              translations: {
                create: {
                  language: "en",
                  title: tool.title,
                  description: tool.description,
                  isPublished: true,
                }
              }
            }
          })

          // Ensure it has an English translation if it existed but without it
          const currentCalc = await prisma.calculator.findUnique({
            where: { slug: calculatorSlug },
            include: { translations: { where: { language: "en" } } }
          })
          if (currentCalc && currentCalc.translations.length === 0) {
            await prisma.calculatorTranslation.create({
              data: {
                calculatorId: currentCalc.id,
                language: "en",
                title: tool.title,
                description: tool.description,
                isPublished: true,
              }
            })
          }
          count++
        }
      }
    }

    return NextResponse.json({ success: true, count })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to sync" }, { status: 500 })
  }
}
