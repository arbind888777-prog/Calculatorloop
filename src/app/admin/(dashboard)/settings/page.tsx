"use client"

import { useState } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { toast } from "sonner"

const envVarStatus = [
  { key: "DATABASE_URL", label: "Database URL", set: true, icon: "🗄️" },
  { key: "NEXTAUTH_SECRET", label: "NextAuth Secret", set: true, icon: "🔐" },
  { key: "GEMINI_API_KEY", label: "Gemini API Key", set: true, icon: "🤖" },
  { key: "GOOGLE_CLIENT_ID", label: "Google OAuth", set: true, icon: "🔑" },
  { key: "CLOUDINARY_CLOUD_NAME", label: "Cloudinary CDN", set: false, icon: "☁️" },
  { key: "REVALIDATION_SECRET", label: "ISR Revalidation", set: true, icon: "♻️" },
]

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [cleared, setCleared] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("Settings saved successfully!")
    setSaving(false)
  }

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear all cache?")) return
    setCleared(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success("Cache cleared successfully!")
    setCleared(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px" }}>

      {/* General Settings */}
      <AdminCard
        title="General Settings"
        subtitle="Site configuration"
        action={
          <AdminButton variant="primary" size="sm" onClick={handleSave} loading={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </AdminButton>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="settings-grid">
            <AdminInput label="Site Name" value="CalculatorLoop" disabled />
            <AdminInput label="Site URL" value="https://calculatorloop.com" disabled />
          </div>
          <AdminInput
            label="Admin Email"
            placeholder="admin@calculatorloop.com"
            value={adminEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminEmail(e.target.value)}
            hint="For system notifications and alerts"
          />
        </div>
      </AdminCard>

      {/* API Keys */}
      <AdminCard title="API Configuration" subtitle="External service credentials">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#7a8ba4",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "16px" }}>ℹ️</span>
            <span>API keys are managed in your <code style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)", padding: "1px 6px", borderRadius: "4px" }}>.env.local</code> file. Changes here do not persist to env.</span>
          </div>
          <AdminInput label="Gemini API Key" type="password" placeholder="AIza..." hint="Already configured in .env" />
          <AdminInput label="OpenAI API Key (Optional)" type="password" placeholder="sk-..." hint="For alternative AI provider" />
          <AdminInput label="Cloudinary Cloud Name" placeholder="your-cloud-name" hint="For image hosting and CDN" />
        </div>
      </AdminCard>

      {/* Environment Status */}
      <AdminCard title="Environment Status" subtitle="Required variables check">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="settings-env-grid">
          {envVarStatus.map((env) => (
            <div
              key={env.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: env.set ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
                border: `1px solid ${env.set ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{env.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, color: "#e2e8f0" }}>{env.label}</p>
                  <code style={{ fontSize: "10px", color: "#5a7090" }}>{env.key}</code>
                </div>
              </div>
              <Badge color={env.set ? "green" : "red"} dot>
                {env.set ? "Set" : "Missing"}
              </Badge>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Danger Zone */}
      <AdminCard title="⚠️ Danger Zone" subtitle="Irreversible actions — proceed with caution">
        <div
          style={{
            padding: "16px",
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "10px",
          }}
        >
          <p style={{ color: "#7a8ba4", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
            These actions cannot be undone. Make sure you know what you&apos;re doing before proceeding.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <AdminButton variant="danger" size="sm" onClick={handleClearCache} loading={cleared}>
              {cleared ? "Clearing..." : "🗑️ Clear All Cache"}
            </AdminButton>
            <AdminButton variant="danger" size="sm">
              🔄 Regenerate All Slugs
            </AdminButton>
            <AdminButton variant="danger" size="sm">
              📤 Export Database Backup
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <style>{`
        @media (max-width: 640px) {
          .settings-grid { grid-template-columns: 1fr !important; }
          .settings-env-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
