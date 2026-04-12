"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { RichEditor, type RichEditorHandle } from "@/components/admin/blog/RichEditor"
import { ImageModal } from "@/components/admin/blog/ImageModal"
import { VideoModal } from "@/components/admin/blog/VideoModal"
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

interface TranslationData {
  title: string
  content: string
  metaTitle: string
  metaDesc: string
  urlSlug: string
  wordCount: number
  isPublished: boolean
}

interface BlogEditorProps {
  blogId?: string
  initialData?: {
    slug: string
    category: string
    status: string
    tags: string[]
    linkedCalculatorId: string
    featuredImage: string
    scheduledAt: string
    translations: Record<string, TranslationData>
  }
}

function createEmptyTranslation(): TranslationData {
  return {
    title: "",
    content: "",
    metaTitle: "",
    metaDesc: "",
    urlSlug: "",
    wordCount: 0,
    isPublished: false,
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

export function BlogEditor({ blogId, initialData }: BlogEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState("en")
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Modal states
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Featured image
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "")
  const [uploadingFeatured, setUploadingFeatured] = useState(false)
  const featuredInputRef = useRef<HTMLInputElement>(null)

  // Editor ref for inserting content from modals
  const editorRef = useRef<RichEditorHandle>(null)

  // Blog-level fields
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [status, setStatus] = useState(initialData?.status || "DRAFT")
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "")
  const [linkedCalculatorId, setLinkedCalculatorId] = useState(
    initialData?.linkedCalculatorId || ""
  )
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduledAt || "")

  // Per-language translations
  const [translations, setTranslations] = useState<Record<string, TranslationData>>(() => {
    const initial: Record<string, TranslationData> = {}
    for (const lang of LANGUAGES) {
      initial[lang.code] = initialData?.translations?.[lang.code] || createEmptyTranslation()
    }
    return initial
  })

  const currentTranslation = translations[activeLanguage] || createEmptyTranslation()

  const updateTranslation = useCallback(
    (field: keyof TranslationData, value: string | number | boolean) => {
      setTranslations((prev) => ({
        ...prev,
        [activeLanguage]: {
          ...prev[activeLanguage],
          [field]: value,
        },
      }))
    },
    [activeLanguage]
  )

  // Auto-generate slugs
  const handleTitleChange = (title: string) => {
    updateTranslation("title", title)
    if (activeLanguage === "en" && !slug) {
      setSlug(generateSlug(title))
    }
    if (!currentTranslation.urlSlug || currentTranslation.urlSlug === translations[activeLanguage]?.urlSlug) {
      updateTranslation("urlSlug", activeLanguage === "en" ? generateSlug(title) : `${activeLanguage}-${generateSlug(title)}`)
    }
    if (!currentTranslation.metaTitle) {
      updateTranslation("metaTitle", title.slice(0, 60))
    }
  }

  // Toast helper
  const toast = (message: string, type: "success" | "error") => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }

  // Featured image upload
  const handleFeaturedImageUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast("Invalid file type. Use JPG, PNG, WebP, or GIF.", "error")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("File too large. Maximum 10MB.", "error")
      return
    }

    setUploadingFeatured(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setFeaturedImage(data.url)
      toast("Featured image uploaded!", "success")
    } catch {
      toast("Failed to upload featured image", "error")
    } finally {
      setUploadingFeatured(false)
    }
  }

  // Modal insert handlers
  const handleImageInsert = (url: string, alt?: string) => {
    editorRef.current?.__insertImage(url, alt)
  }

  const handleYoutubeInsert = (url: string) => {
    if (editorRef.current?.__insertYoutube) {
      editorRef.current.__insertYoutube(url)
    }
  }

  const handleVideoUploadInsert = (url: string) => {
    if (editorRef.current?.__insertVideoHtml) {
      editorRef.current.__insertVideoHtml(url)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const body = {
        slug,
        category: category || null,
        linkedCalculatorId: linkedCalculatorId || null,
        featuredImage: featuredImage || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: "DRAFT",
        scheduledAt: scheduledAt || null,
        translations: Object.entries(translations)
          .filter(([, t]) => t.title)
          .map(([lang, t]) => ({
            ...t,
            language: lang,
            urlSlug: t.urlSlug || `${lang}-${slug}`,
          })),
      }

      if (blogId) {
        // Update existing
        const res = await fetch(`/api/admin/blog/${blogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Failed to update")

        // Update each translation
        for (const [lang, t] of Object.entries(translations)) {
          if (t.title) {
            await fetch(`/api/admin/blog/${blogId}/translations/${lang}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...t, urlSlug: t.urlSlug || `${lang}-${slug}` }),
            })
          }
        }
        toast("Draft saved successfully!", "success")
      } else {
        // Create new
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.id) {
          toast("Blog post created!", "success")
          router.push(`/admin/blog/${data.id}/edit`)
        }
      }
    } catch (err) {
      console.error("Save failed:", err)
      toast("Failed to save. Check console for details.", "error")
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      // Save first
      await handleSaveDraft()
      // Then publish
      if (blogId) {
        const res = await fetch(`/api/admin/blog/${blogId}/publish`, { method: "POST" })
        if (res.ok) {
          setStatus("PUBLISHED")
          toast("Blog post published! ISR revalidation triggered.", "success")
        } else {
          throw new Error("Publish failed")
        }
      }
    } catch (err) {
      console.error("Publish failed:", err)
      toast("Failed to publish", "error")
    }
    setPublishing(false)
  }

  return (
    <div>
      {/* Toast notification */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            background: showToast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${showToast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: "10px",
            color: showToast.type === "success" ? "#4ade80" : "#f87171",
            fontSize: "13px",
            fontWeight: 500,
            zIndex: 2000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            animation: "slideInRight 0.25s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>{showToast.type === "success" ? "✅" : "⚠️"}</span>
          {showToast.message}
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={handleImageInsert}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onInsertYoutube={handleYoutubeInsert}
        onInsertUpload={handleVideoUploadInsert}
      />

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language tabs */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "#0f1623",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid #1c2a3d",
            }}
          >
            {LANGUAGES.map((lang) => {
              const hasContent = !!translations[lang.code]?.title
              return (
                <button
                  key={lang.code}
                  onClick={() => setActiveLanguage(lang.code)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: activeLanguage === lang.code ? 600 : 400,
                    color: activeLanguage === lang.code ? "#e2e8f0" : "#5a7090",
                    background: activeLanguage === lang.code ? "#3b82f6" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                    position: "relative",
                  }}
                >
                  {lang.flag} {lang.code.toUpperCase()}
                  {hasContent && activeLanguage !== lang.code && (
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#22c55e",
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Word count */}
          <span style={{ fontSize: "12px", color: "#5a7090" }}>
            {currentTranslation.wordCount} words
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <AdminButton variant="outline" size="sm" loading={saving} onClick={handleSaveDraft}>
            💾 Save Draft
          </AdminButton>
          <AdminButton variant="primary" size="sm" loading={publishing} onClick={handlePublish}>
            🚀 Publish
          </AdminButton>
        </div>
      </div>

      {/* Main grid: Editor + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        {/* Left: Editor */}
        <div>
          {/* Category + Slug */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <AdminSelect
              label="Category"
              options={[
                { value: "", label: "Select category..." },
                { value: "financial", label: "Financial" },
                { value: "health", label: "Health & Fitness" },
                { value: "math", label: "Mathematics" },
                { value: "science", label: "Science" },
                { value: "technology", label: "Technology" },
                { value: "education", label: "Education" },
                { value: "business", label: "Business" },
                { value: "construction", label: "Construction" },
                { value: "everyday", label: "Everyday" },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <AdminInput
              label="Blog Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-blog-post-slug"
            />
          </div>

          {/* Active language indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
              padding: "8px 12px",
              background: "rgba(59,130,246,0.06)",
              borderRadius: "8px",
              border: "1px solid rgba(59,130,246,0.1)",
            }}
          >
            <span style={{ fontSize: "16px" }}>
              {LANGUAGES.find((l) => l.code === activeLanguage)?.flag}
            </span>
            <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 500 }}>
              Editing: {LANGUAGES.find((l) => l.code === activeLanguage)?.label} ({activeLanguage.toUpperCase()})
            </span>
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Enter blog title..."
            value={currentTranslation.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 18px",
              background: "#0f1623",
              border: "1px solid #1c2a3d",
              borderRadius: "10px",
              color: "#e2e8f0",
              fontSize: "22px",
              fontWeight: 700,
              outline: "none",
              marginBottom: "12px",
              boxSizing: "border-box",
              fontFamily: "inherit",
              letterSpacing: "-0.5px",
            }}
          />

          {/* Rich Editor */}
          <RichEditor
            content={currentTranslation.content}
            onUpdate={(html) => updateTranslation("content", html)}
            onWordCount={(count) => updateTranslation("wordCount", count)}
            onOpenImageModal={() => setShowImageModal(true)}
            onOpenVideoModal={() => setShowVideoModal(true)}
            ref={editorRef}
          />

          {/* Language status bar */}
          <div
            style={{
              marginTop: "16px",
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "12px 16px",
            }}
          >
            <p style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>
              Language Versions
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {LANGUAGES.map((lang) => {
                const t = translations[lang.code]
                const hasContent = !!t?.title
                return (
                  <div
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: activeLanguage === lang.code ? "rgba(59,130,246,0.1)" : "rgba(15,22,35,0.5)",
                      border: `1px solid ${activeLanguage === lang.code ? "rgba(59,130,246,0.3)" : "#1c2a3d"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{lang.flag}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                      {lang.code.toUpperCase()}
                    </span>
                    <Badge color={hasContent ? "green" : "gray"} dot>
                      {hasContent ? "Done" : "Empty"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Featured Image */}
          <div
            style={{
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
              🖼️ Featured Image
            </h4>
            {featuredImage ? (
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImage}
                  alt="Featured"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    maxHeight: "160px",
                    objectFit: "cover",
                    border: "1px solid #1c2a3d",
                  }}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => featuredInputRef.current?.click()}
                    style={{ flex: 1, fontSize: "11px" }}
                  >
                    Change
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    onClick={() => setFeaturedImage("")}
                    style={{ fontSize: "11px" }}
                  >
                    Remove
                  </AdminButton>
                </div>
              </div>
            ) : (
              <div
                onClick={() => featuredInputRef.current?.click()}
                style={{
                  border: "2px dashed #1c2a3d",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px", opacity: 0.5 }}>
                  {uploadingFeatured ? "⏳" : "📷"}
                </div>
                <p style={{ margin: 0, color: "#5a7090", fontSize: "11px" }}>
                  {uploadingFeatured ? "Uploading..." : "Click to upload featured image"}
                </p>
              </div>
            )}
            <input
              ref={featuredInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFeaturedImageUpload(file)
              }}
              style={{ display: "none" }}
            />
          </div>

          {/* Publish Settings */}
          <div
            style={{
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
              📋 Publish Settings
            </h4>

            <AdminSelect
              label="Status"
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "REVIEW", label: "In Review" },
                { value: "PUBLISHED", label: "Published" },
                { value: "SCHEDULED", label: "Scheduled" },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />

            {status === "SCHEDULED" && (
              <AdminInput
                label="Schedule Date & Time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}

            <AdminInput
              label="Linked Calculator ID"
              value={linkedCalculatorId}
              onChange={(e) => setLinkedCalculatorId(e.target.value)}
              placeholder="e.g. bmi-calculator"
              hint="Link this blog to a calculator"
            />

            <AdminInput
              label="Tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              hint="Comma-separated tags"
            />

            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <AdminButton variant="outline" size="sm" onClick={handleSaveDraft} loading={saving} style={{ flex: 1 }}>
                Save Draft
              </AdminButton>
              <AdminButton variant="primary" size="sm" onClick={handlePublish} loading={publishing} style={{ flex: 1 }}>
                Publish
              </AdminButton>
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                background: "rgba(59,130,246,0.06)",
                borderRadius: "6px",
                border: "1px solid rgba(59,130,246,0.1)",
              }}
            >
              <p style={{ margin: 0, fontSize: "11px", color: "#5a7090", lineHeight: 1.5 }}>
                💡 When published, this post will be available at:<br />
                <strong style={{ color: "#60a5fa" }}>
                  calculatorloop.com/{activeLanguage}/blog/{currentTranslation.urlSlug || slug || "..."}
                </strong>
              </p>
            </div>
          </div>

          {/* SEO Settings */}
          <div
            style={{
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
              🔍 SEO Settings ({activeLanguage.toUpperCase()})
            </h4>

            <AdminInput
              label="Meta Title"
              value={currentTranslation.metaTitle}
              onChange={(e) => updateTranslation("metaTitle", e.target.value)}
              placeholder="SEO title (max 60 chars)"
              counter={{ current: currentTranslation.metaTitle.length, max: 60 }}
            />

            <AdminTextarea
              label="Meta Description"
              value={currentTranslation.metaDesc}
              onChange={(e) => updateTranslation("metaDesc", e.target.value)}
              placeholder="SEO description (max 160 chars)"
              counter={{ current: currentTranslation.metaDesc.length, max: 160 }}
              style={{ minHeight: "60px" }}
            />

            <AdminInput
              label="URL Slug"
              value={currentTranslation.urlSlug}
              onChange={(e) => updateTranslation("urlSlug", e.target.value)}
              placeholder="url-slug-for-this-language"
              hint="Unique per language. Auto-generated from title."
            />

            {/* Google Preview */}
            <div style={{ marginTop: "8px" }}>
              <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#5a7090", fontWeight: 600 }}>
                Google Search Preview
              </p>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "12px",
                }}
              >
                <p style={{ margin: 0, color: "#1a0dab", fontSize: "14px", fontWeight: 500 }}>
                  {currentTranslation.metaTitle || currentTranslation.title || "Page Title"}
                </p>
                <p style={{ margin: "2px 0", color: "#006621", fontSize: "11px" }}>
                  calculatorloop.com/{activeLanguage}/blog/{currentTranslation.urlSlug || slug || "..."}
                </p>
                <p style={{ margin: 0, color: "#545454", fontSize: "11px", lineHeight: 1.4 }}>
                  {currentTranslation.metaDesc || "Add a meta description to improve SEO..."}
                </p>
              </div>
            </div>
          </div>

          {/* Language Versions Panel */}
          <div
            style={{
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
              🌍 Language Versions
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {LANGUAGES.map((lang) => {
                const t = translations[lang.code]
                const hasContent = !!t?.title
                return (
                  <div
                    key={lang.code}
                    onClick={() => setActiveLanguage(lang.code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: activeLanguage === lang.code ? "rgba(59,130,246,0.08)" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px" }}>{lang.flag}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{lang.label}</span>
                    </div>
                    <Badge color={hasContent ? "green" : "gray"}>
                      {hasContent ? `${t.wordCount || 0}w` : "—"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
