"use client"

import { useState, useEffect, use } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"
import { PageLoader, Spinner } from "@/components/admin/ui/Spinner"
import { useRouter } from "next/navigation"

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "id", label: "Indonesian" },
  { code: "ar", label: "Arabic" },
  { code: "ur", label: "Urdu" },
  { code: "ja", label: "Japanese" }
]

export default function CalculatorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)

  const [baseData, setBaseData] = useState<any>(null)
  const [activeLang, setActiveLang] = useState("en")
  
  const [savingBase, setSavingBase] = useState(false)
  const [savingTranslation, setSavingTranslation] = useState(false)

  const [translationData, setTranslationData] = useState<any>({
    title: "", description: "", metaTitle: "", metaDesc: "", isPublished: false
  })

  // Fetch initial base data + all translations
  useEffect(() => {
    const fetchCalc = async () => {
      try {
        const res = await fetch(`/api/admin/calculators/${id}`)
        if (!res.ok) {
          router.push("/admin/calculators")
          return
        }
        const data = await res.json()
        setBaseData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCalc()
  }, [id, router])

  // Map translations locally when tab changes
  useEffect(() => {
    if (!baseData || !baseData.translations) return;
    const trans = baseData.translations.find((t: any) => t.language === activeLang)
    if (trans) {
      setTranslationData({
        title: trans.title || "",
        description: trans.description || "",
        metaTitle: trans.metaTitle || "",
        metaDesc: trans.metaDesc || "",
        isPublished: trans.isPublished || false
      })
    } else {
      setTranslationData({ title: "", description: "", metaTitle: "", metaDesc: "", isPublished: false })
    }
  }, [activeLang, baseData])

  const handleBaseSave = async () => {
    setSavingBase(true)
    try {
      const res = await fetch(`/api/admin/calculators/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: baseData.isActive,
          isFeatured: baseData.isFeatured,
          categoryId: baseData.categoryId,
          subcategory: baseData.subcategory
        })
      })
      if (res.ok) {
        const updated = await res.json()
        setBaseData(updated)
        alert("Base settings updated!")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingBase(false)
    }
  }

  const handleTranslationSave = async () => {
    setSavingTranslation(true)
    try {
      const res = await fetch(`/api/admin/calculators/${id}/translations/${activeLang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(translationData)
      })
      if (res.ok) {
        const updatedTrans = await res.json()
        // Update local baseData translations array
        setBaseData((prev: any) => {
          const newTrans = prev.translations.filter((t: any) => t.language !== activeLang)
          newTrans.push(updatedTrans)
          return { ...prev, translations: newTrans }
        })
        alert(`${activeLang.toUpperCase()} Translation Updated!`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSavingTranslation(false)
    }
  }

  if (loading) return <PageLoader message="Loading Calculator Editor..." />

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", color: "#e2e8f0" }}>
          Edit Calculator: {baseData?.slug}
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
          Manage global configurations and localized translations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start" }}>
        {/* LEFT COMPONENT - BASE */}
        <AdminCard title="Base Settings">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
            <AdminInput 
              label="Slug (Read-Only)" 
              value={baseData!.slug} 
              disabled 
            />
            
            <AdminInput 
              label="Total Uses" 
              value={baseData!.totalUses.toString()} 
              disabled 
            />

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#7a8ba4", marginBottom: "8px" }}>
                Feature Flags
              </label>
              <div style={{ display: "flex", gap: "12px", background: "#0f1623", padding: "16px", borderRadius: "8px", border: "1px solid #1c2a3d" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0", fontSize: "13px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={baseData!.isActive}
                    onChange={(e) => setBaseData({ ...baseData, isActive: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  Is Active
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0", fontSize: "13px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={baseData!.isFeatured}
                    onChange={(e) => setBaseData({ ...baseData, isFeatured: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  Is Featured
                </label>
              </div>
            </div>

            <AdminInput 
              label="Subcategory" 
              value={baseData!.subcategory || ""} 
              onChange={(e) => setBaseData({ ...baseData, subcategory: e.target.value })}
              placeholder="e.g. Loans, Mortgages"
            />

            <AdminButton 
              variant="primary" 
              loading={savingBase} 
              onClick={handleBaseSave}
              style={{ marginTop: "8px", width: "100%" }}
            >
              Update Base Settings
            </AdminButton>
          </div>
        </AdminCard>

        {/* RIGHT COMPONENT - TRANSLATIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", overflowX: "auto", gap: "8px", paddingBottom: "12px" }}>
            {SUPPORTED_LANGUAGES.map((l) => (
               <button
                 key={l.code}
                 onClick={() => setActiveLang(l.code)}
                 style={{
                   padding: "8px 16px",
                   borderRadius: "8px",
                   cursor: "pointer",
                   border: activeLang === l.code ? "1px solid #3b82f6" : "1px solid #1c2a3d",
                   background: activeLang === l.code ? "rgba(59,130,246,0.15)" : "#0f1623",
                   color: activeLang === l.code ? "#60a5fa" : "#7a8ba4",
                   fontSize: "13px",
                   fontWeight: activeLang === l.code ? 600 : 400,
                   whiteSpace: "nowrap"
                 }}
               >
                 {l.label}
               </button>
            ))}
          </div>

          <AdminCard title={`${SUPPORTED_LANGUAGES.find(l => l.code === activeLang)?.label} Translation`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
              <AdminInput 
                label="Frontend Display Title" 
                value={translationData.title}
                onChange={(e) => setTranslationData({...translationData, title: e.target.value})}
                placeholder="e.g. Personal Loan Calculator"
              />

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#7a8ba4", marginBottom: "8px" }}>
                  Description / Subtitle
                </label>
                <textarea 
                  value={translationData.description}
                  onChange={(e) => setTranslationData({...translationData, description: e.target.value})}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", background: "#0f1623",
                    border: "1px solid #1c2a3d", borderRadius: "8px", color: "#e2e8f0",
                    fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical"
                  }}
                  placeholder="Appears directly under the tool title..."
                />
              </div>

              <AdminInput 
                label="SEO Meta Title" 
                value={translationData.metaTitle}
                onChange={(e) => setTranslationData({...translationData, metaTitle: e.target.value})}
                placeholder="Override the generated global meta title..."
              />

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#7a8ba4", marginBottom: "8px" }}>
                  SEO Meta Description
                </label>
                <textarea 
                  value={translationData.metaDesc}
                  onChange={(e) => setTranslationData({...translationData, metaDesc: e.target.value})}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", background: "#0f1623",
                    border: "1px solid #1c2a3d", borderRadius: "8px", color: "#e2e8f0",
                    fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical"
                  }}
                  placeholder="Override the generated meta description..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <AdminButton 
                  variant="primary" 
                  onClick={handleTranslationSave}
                  loading={savingTranslation}
                  disabled={!translationData.title}
                >
                  Save Localized Changes
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
