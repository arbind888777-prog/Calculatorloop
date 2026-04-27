import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { requireAdmin } from "@/lib/adminGuard"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error("Gemini API error:", error)
    throw new Error("AI generation failed")
  }
}

/**
 * POST /api/admin/ai/generate-blog-outline
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin("editor")
    if (!guard.ok) return guard.response

    const { input, language } = await request.json()
    if (!input) {
      return NextResponse.json({ error: "Input required" }, { status: 400 })
    }

    const prompt = `Generate a comprehensive blog outline for a calculator tutorial/guide.
Topic: ${input}
Language: ${language || "en"}

Create a detailed blog outline with:
1. An SEO-optimized title
2. Introduction section
3. 5-8 main headings (H2) with 2-3 sub-points each
4. FAQ section with 4-5 questions
5. Conclusion

Format the output as a structured outline with headings and bullet points.
Make it informative, educational, and optimized for search engines.`

    const result = await generateWithGemini(prompt)
    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "AI generation failed" }, { status: 500 })
  }
}
