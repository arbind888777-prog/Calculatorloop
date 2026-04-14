"use client"

import { useState, useCallback } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { AdminInput, AdminTextarea } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"
import { Badge } from "@/components/admin/ui/Badge"

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "bn", label: "Bengali", flag: "🇧🇩" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "te", label: "Telugu", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", flag: "🇮🇳" },
]

export function CalculatorEditorClient({ calculator, categories }: { calculator: any, categories: any[] }) {
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [activeLanguage, setActiveLanguage] = useState("en")

  // Global Info
  const [slug, setSlug] = useState(calculator.slug || "")
  const [categoryId, setCategoryId] = useState(calculator.categoryId || "")
  const [subcategory, setSubcategory] = useState(calculator.subcategory || "")
  const [isActive, setIsActive] = useState(calculator.isActive)
  const [isFeatured, setIsFeatured] = useState(calculator.isFeatured)

  // Translations
  const [translations, setTranslations] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    for (const lang of LANGUAGES) {
      const existing = calculator.translations?.find((t: any) => t.language === lang.code)
      initial[lang.code] = existing || {
        language: lang.code,
        title: "",
        description: "",
        metaTitle: "",
        metaDesc: "",
      }
    }
    return initial
  })

  const currentTranslation = translations[activeLanguage]

  const updateTranslation = useCallback((field: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLanguage]: {
        ...prev[activeLanguage],
        [field]: value,
      },
    }))
  }, [activeLanguage])

  const toast = (message: string, type: "success" | "error") => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Update overall calculator info
      const calcRes = await fetch(`/api/admin/calculators/${calculator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, categoryId, subcategory, isActive, isFeatured }),
      })

      if (!calcRes.ok) throw new Error("Failed to update calculator")

      // 2. Update each translation that has content
      for (const [lang, t] of Object.entries(translations)) {
        if (t.title) {
          await fetch(`/api/admin/calculators/${calculator.id}/translations/${lang}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t),
          })
        }
      }

      toast("Calculator saved successfully!", "success")
    } catch (err) {
      console.error(err)
      toast("Failed to save calculator", "error")
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Toast */}
      {showToast && (
        <div
          style={{
            position: "fixed", top: "20px", right: "20px", padding: "12px 20px", zIndex: 9999,
            background: showToast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${showToast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: "10px", color: showToast.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {showToast.message}
        </div>
      )}

      {/* Global Setting & Languages Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>
        
        {/* Left Side: Translation Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <AdminCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Global Settings</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <AdminInput label="System ID (Read Only)" value={calculator.id} readOnly />
              <AdminInput label="URL Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              
              <AdminSelect
                label="Category"
                options={[
                  { value: "", label: "No Category" },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              />
              <AdminInput label="Subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Status</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <AdminButton variant={isActive ? "primary" : "outline"} onClick={() => setIsActive(true)} size="sm">Active</AdminButton>
                  <AdminButton variant={!isActive ? "danger" : "outline"} onClick={() => setIsActive(false)} size="sm">Inactive</AdminButton>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Featured</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <AdminButton variant={isFeatured ? "primary" : "outline"} onClick={() => setIsFeatured(true)} size="sm">Yes</AdminButton>
                  <AdminButton variant={!isFeatured ? "outline" : "outline"} onClick={() => setIsFeatured(false)} size="sm">No</AdminButton>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Translation: {LANGUAGES.find(l => l.code === activeLanguage)?.label}</h3>
              <div style={{ display: "flex", gap: "4px", background: "#0f1623", padding: "4px", borderRadius: "8px", border: "1px solid #1c2a3d" }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    style={{
                      padding: "6px 10px", borderRadius: "6px", border: "none", fontSize: "12px",
                      background: activeLanguage === lang.code ? "#3b82f6" : "transparent",
                      color: activeLanguage === lang.code ? "#fff" : "#94a3b8",
                      cursor: "pointer"
                    }}
                  >
                    {lang.flag} {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <AdminInput
                label="Title (H1)"
                value={currentTranslation.title}
                onChange={(e) => updateTranslation("title", e.target.value)}
              />
              <AdminTextarea
                label="Description"
                value={currentTranslation.description}
                onChange={(e) => updateTranslation("description", e.target.value)}
              />
            </div>
          </AdminCard>
          
          <AdminCard>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>SEO Settings ({activeLanguage.toUpperCase()})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <AdminInput
                label="Meta Title"
                value={currentTranslation.metaTitle}
                onChange={(e) => updateTranslation("metaTitle", e.target.value)}
                counter={{ current: currentTranslation.metaTitle.length, max: 60 }}
              />
              <AdminTextarea
                label="Meta Description"
                value={currentTranslation.metaDesc}
                onChange={(e) => updateTranslation("metaDesc", e.target.value)}
                counter={{ current: currentTranslation.metaDesc.length, max: 160 }}
              />
            </div>
          </AdminCard>
        </div>

        {/* Right Side: Save & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <AdminCard>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Actions</h3>
            <AdminButton variant="primary" onClick={handleSave} loading={saving} style={{ width: "100%" }}>
              💾 Save Changes
            </AdminButton>
          </AdminCard>

          <AdminCard>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Calculator Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Total Uses</span>
                <strong>{calculator.totalUses?.toLocaleString() || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Created</span>
                <strong>{new Date(calculator.createdAt).toLocaleDateString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Updated</span>
                <strong>{new Date(calculator.updatedAt).toLocaleDateString()}</strong>
              </div>
              
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #1c2a3d" }}>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>Language Status:</span>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {LANGUAGES.map(lang => {
                    const hasTitle = translations[lang.code]?.title?.length > 0;
                    return (
                      <Badge key={lang.code} color={hasTitle ? "green" : "gray"}>
                        {lang.code.toUpperCase()}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
        
      </div>
    </div>
  )
}
