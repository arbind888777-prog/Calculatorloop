"use client"

import { useState } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminInput, AdminTextarea } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"

const aiFeatures = [
  {
    id: "blog-outline",
    title: "Blog Outline Generator",
    description: "Generate complete blog outlines with headings from calculator name and keywords",
    icon: "📝",
    status: "active" as const,
    endpoint: "/api/admin/ai/generate-blog-outline",
  },
  {
    id: "meta-generator",
    title: "Meta Tags Generator",
    description: "Generate SEO-optimized meta titles and descriptions",
    icon: "🏷️",
    status: "active" as const,
    endpoint: "/api/admin/ai/generate-meta",
  },
  {
    id: "description",
    title: "Calculator Description",
    description: "Generate SEO-optimized descriptions for calculators",
    icon: "📄",
    status: "active" as const,
    endpoint: "/api/admin/ai/generate-description",
  },
  {
    id: "improve",
    title: "Content Improver",
    description: "Improve existing blog content with better SEO and readability",
    icon: "✨",
    status: "active" as const,
    endpoint: "/api/admin/ai/improve-content",
  },
]

export default function AIPage() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [language, setLanguage] = useState("en")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRun = async (endpoint: string) => {
    setLoading(true)
    setOutput("")
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, language }),
      })
      const data = await res.json()
      setOutput(data.result || data.outline || data.metaTitle
        ? JSON.stringify(data, null, 2)
        : data.error || "No output")
    } catch {
      setOutput("Error: Failed to generate content")
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Feature Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {aiFeatures.map((feature) => (
          <div
            key={feature.id}
            onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
            style={{
              background: activeFeature === feature.id ? "rgba(59,130,246,0.08)" : "#131d2e",
              borderRadius: "10px",
              border: `1px solid ${activeFeature === feature.id ? "rgba(59,130,246,0.3)" : "#1c2a3d"}`,
              padding: "16px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>{feature.icon}</span>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>
                  {feature.title}
                </h3>
              </div>
              <Badge color={feature.status === "active" ? "green" : "yellow"} dot>
                {feature.status}
              </Badge>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#5a7090", lineHeight: 1.5 }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Active Feature Panel */}
      {activeFeature && (
        <AdminCard title={`🤖 ${aiFeatures.find((f) => f.id === activeFeature)?.title}`}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Input */}
            <div>
              <AdminTextarea
                label="Input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeFeature === "blog-outline"
                    ? "Calculator name, keywords..."
                    : activeFeature === "meta-generator"
                    ? "Page title and content summary..."
                    : activeFeature === "description"
                    ? "Calculator name, category..."
                    : "Paste existing content to improve..."
                }
                style={{ minHeight: "120px" }}
              />
              <AdminSelect
                label="Language"
                options={[
                  { value: "en", label: "English" },
                  { value: "hi", label: "Hindi" },
                  { value: "es", label: "Spanish" },
                  { value: "bn", label: "Bengali" },
                  { value: "ta", label: "Tamil" },
                  { value: "te", label: "Telugu" },
                  { value: "mr", label: "Marathi" },
                ]}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
              <AdminButton
                variant="primary"
                size="md"
                loading={loading}
                onClick={() => handleRun(aiFeatures.find((f) => f.id === activeFeature)!.endpoint)}
              >
                🤖 Generate
              </AdminButton>
            </div>

            {/* Output */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#94a3b8", marginBottom: "6px" }}>
                Output
              </label>
              <div
                style={{
                  background: "#0f1623",
                  border: "1px solid #1c2a3d",
                  borderRadius: "8px",
                  padding: "14px",
                  minHeight: "200px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {output ? (
                  <pre style={{ margin: 0, fontSize: "12px", color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
                    {output}
                  </pre>
                ) : (
                  <p style={{ color: "#3a4f6b", fontSize: "12px", margin: 0 }}>
                    Output will appear here...
                  </p>
                )}
              </div>
              {output && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(output)}
                  style={{ marginTop: "8px" }}
                >
                  📋 Copy Output
                </AdminButton>
              )}
            </div>
          </div>
        </AdminCard>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: "24px", padding: "16px", background: "rgba(59,130,246,0.06)",
          borderRadius: "10px", border: "1px solid rgba(59,130,246,0.1)",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", color: "#5a7090", lineHeight: 1.6 }}>
          💡 AI features use the <strong style={{ color: "#60a5fa" }}>Gemini API</strong> (already configured).
          Set <code style={{ color: "#60a5fa" }}>GEMINI_API_KEY</code> in your environment variables.
          OpenAI can be added as an alternative in Settings.
        </p>
      </div>
    </div>
  )
}
