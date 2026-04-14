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
    const prompt = `Write an SEO-optimized description for this calculator tool.
Calculator: ${input}
Language: ${language || "en"}

Requirements:
- 150-200 words
- Include the calculator name naturally
- Explain what it does and who it's for
- Include a call to action
- Use language: ${language || "en"}

Return only the description text, no other formatting.`

    const result = await model.generateContent(prompt)
    return NextResponse.json({ result: result.response.text() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
