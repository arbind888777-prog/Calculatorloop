import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()
    if (!input) {
      return NextResponse.json({ error: "Input required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const prompt = `Improve the following blog content for better SEO and readability.

Content to improve:
${input}

Requirements:
- Maintain the same language as the original
- Add proper headings (H2, H3) if missing
- Improve sentence structure and flow
- Add transition words
- Ensure keyword density is optimal
- Add a short FAQ section at the end if not already present
- Keep the same topic and meaning
- Return the improved HTML content

Return only the improved HTML content.`

    const result = await model.generateContent(prompt)
    return NextResponse.json({ result: result.response.text() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
