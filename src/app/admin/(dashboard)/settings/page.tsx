"use client"

import { AdminCard } from "@/components/admin/ui/Card"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <AdminCard title="General Settings">
        <AdminInput label="Site Name" value="CalculatorLoop" disabled />
        <AdminInput label="Site URL" value="https://calculatorloop.com" disabled />
        <AdminInput label="Admin Email" placeholder="admin@calculatorloop.com" />
      </AdminCard>

      <AdminCard title="API Configuration">
        <AdminInput label="Gemini API Key" type="password" placeholder="AIza..." hint="Already configured in .env" />
        <AdminInput label="OpenAI API Key (Optional)" type="password" placeholder="sk-..." hint="For alternative AI provider" />
        <AdminInput label="Revalidation Secret" type="password" placeholder="Your ISR secret" hint="Used for on-demand revalidation" />
      </AdminCard>

      <AdminCard title="Environment Status">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { key: "DATABASE_URL", set: true },
            { key: "NEXTAUTH_SECRET", set: true },
            { key: "GEMINI_API_KEY", set: !!process.env.NEXT_PUBLIC_SITE_URL },
            { key: "GOOGLE_CLIENT_ID", set: true },
            { key: "REVALIDATION_SECRET", set: false },
          ].map((env) => (
            <div key={env.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <code style={{ fontSize: "12px", color: "#94a3b8" }}>{env.key}</code>
              <Badge color={env.set ? "green" : "red"}>{env.set ? "Set" : "Missing"}</Badge>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Danger Zone">
        <p style={{ color: "#5a7090", fontSize: "12px", marginBottom: "12px" }}>
          These actions are irreversible. Proceed with caution.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <AdminButton variant="danger" size="sm">Clear All Cache</AdminButton>
          <AdminButton variant="danger" size="sm">Regenerate All Slugs</AdminButton>
        </div>
      </AdminCard>
    </div>
  )
}
