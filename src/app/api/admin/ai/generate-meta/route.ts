import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { input, language } = await request.json()
    if (!input) {
      return NextResponse.json({ error: "Input required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const prompt = `Generate SEO meta tags for the following page.
Page info: ${input}
Language: ${language || "en"}

Return ONLY a JSON object with these fields:
{
  "metaTitle": "The SEO title (max 60 characters)",
  "metaDesc": "The meta description (max 160 characters)",
  "focusKeywords": ["keyword1", "keyword2", "keyword3"]
}

Make it compelling, include the primary keyword naturally, and optimize for click-through rate.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Try to parse as JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      }
    } catch {
      // If not parseable, return as text
    }

    return NextResponse.json({ result: text })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
