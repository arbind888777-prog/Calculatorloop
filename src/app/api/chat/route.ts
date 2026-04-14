import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"

// Initialize Gemini with the API KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { messages, locale = "en" } = await request.json()
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    // 1. Fetch all active calculators for context
    const calculators = await prisma.calculator.findMany({
      where: { isActive: true },
      include: {
        translations: {
          where: { language: locale }
        }
      }
    })

    const toolList = calculators.map(c => {
      const trans = c.translations[0]
      return {
        name: trans?.title || c.slug,
        slug: c.slug,
        description: trans?.description || ""
      }
    })

    // 2. Prepare the System Prompt
    const systemPrompt = `You are "LoopBot", the intelligent AI assistant for CalculatorLoop (https://calculatorloop.com).
Your goal is to help users with their calculations, answer questions, and suggest the best tools from our website.

WEBSITE CONTEXT:
- You are representing CalculatorLoop, a platform with 1700+ free online calculators.
- Current Language: ${locale}
- Available Tools on our site:
${toolList.map(t => `- ${t.name} (URL: /calculator/${t.slug}): ${t.description.slice(0, 100)}...`).join("\n")}

STRICT RULES:
1. Always be polite, premium, and helpful.
2. If a user asks for a calculation that we have a tool for, suggest that tool with its link (e.g., [BMI Calculator](/calculator/bmi-calculator)).
3. If they ask a general math/finance question, answer it directly but ALSO suggest an appropriate tool from our list.
4. Keep responses concise and formatted with Markdown.
5. If the tool they need is not in the list, still try to help them with the calculation.
6. Use the user's language (${locale}) for responding if they speak in it.

The following is the conversation history:`

    // 3. Initialize Model
    // Using gemini-2.0-flash for speed and efficiency as seen in existing project code
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // 4. Construct Content for Gemini
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am LoopBot, ready to assist CalculatorLoop users." }],
        },
        ...messages.slice(0, -1).map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
      ],
    })

    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(lastMessage)
    const responseText = result.response.text()

    return NextResponse.json({ 
      content: responseText,
      role: "assistant"
    })

  } catch (error: any) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to generate response",
      details: "Please check your GEMINI_API_KEY and network connection."
    }, { status: 500 })
  }
}
