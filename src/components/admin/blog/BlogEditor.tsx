"use client"

import { useState, useCallback, useRef, useEffect, useMemo, type DragEvent } from "react"
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
    subcategory: string
    status: string
    tags: string[]
    linkedCalculatorId: string
    featuredImage: string
    scheduledAt: string
    translations: Record<string, TranslationData>
  }
}

interface CalculatorOption {
  value: string
  label: string
}

type AutoSaveState = "idle" | "saving" | "saved" | "error"

const NEW_DRAFT_STORAGE_KEY = "admin-blog-draft-v2"

function buildSeoScore(params: {
  title: string
  metaTitle: string
  metaDesc: string
  urlSlug: string
  content: string
  wordCount: number
  featuredImage: string
}) {
  let score = 0
  const checks: string[] = []

  if (params.title.trim().length >= 20) {
    score += 20
    checks.push("Title is present")
  }
  if (params.metaTitle.trim().length >= 30 && params.metaTitle.trim().length <= 60) {
    score += 20
    checks.push("Meta title length is good")
  }
  if (params.metaDesc.trim().length >= 80 && params.metaDesc.trim().length <= 160) {
    score += 20
    checks.push("Meta description is optimized")
  }
  if (params.urlSlug.trim().length >= 8) {
    score += 10
    checks.push("Slug is ready")
  }
  if (params.wordCount >= 300 || params.content.replace(/<[^>]*>/g, " ").trim().length >= 1200) {
    score += 20
    checks.push("Content depth is healthy")
  }
  if (params.featuredImage) {
    score += 10
    checks.push("Featured image is set")
  }

  return {
    score,
    checks,
    grade: score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 45 ? "Needs Work" : "Weak",
  }
}

function formatSavedAt(timestamp: number | null) {
  if (!timestamp) return "Not saved yet"

  return `Last saved at ${new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
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
  if (!title) return `post-${Date.now()}`
  const slug = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
  return slug || `post-${Date.now()}`
}

export function BlogEditor({ blogId, initialData }: BlogEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [persistedBlogId, setPersistedBlogId] = useState(blogId || "")
  const [activeLanguage, setActiveLanguage] = useState("en")
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [saveError, setSaveError] = useState("")
  const [loadingCalculators, setLoadingCalculators] = useState(false)
  const [calculatorSearch, setCalculatorSearch] = useState("")
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [calculatorOptions, setCalculatorOptions] = useState<CalculatorOption[]>([
    { value: "", label: "No linked calculator" },
  ])

  // Modal states
  const [showImageModal, setShowImageModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Featured image
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "")
  const [featuredImageUrlInput, setFeaturedImageUrlInput] = useState("")
  const [featuredDropActive, setFeaturedDropActive] = useState(false)
  const [uploadingFeatured, setUploadingFeatured] = useState(false)
  const featuredInputRef = useRef<HTMLInputElement>(null)

  // Editor ref for inserting content from modals
  const editorRef = useRef<RichEditorHandle>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedDraftRef = useRef(false)
  const lastAutosavedSnapshotRef = useRef("")

  // Blog-level fields
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || "")
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
  const effectiveBlogId = blogId || persistedBlogId || undefined

  const currentTranslation = translations[activeLanguage] || createEmptyTranslation()
  const activeLanguageMeta = LANGUAGES.find((lang) => lang.code === activeLanguage) || LANGUAGES[0]
  const completedTranslations = LANGUAGES.filter((lang) => !!translations[lang.code]?.title).length
  const seoReadyLanguages = LANGUAGES.filter(
    (lang) => !!translations[lang.code]?.metaTitle && !!translations[lang.code]?.metaDesc
  ).length
  const seoInsight = useMemo(
    () => buildSeoScore({
      title: currentTranslation.title,
      metaTitle: currentTranslation.metaTitle,
      metaDesc: currentTranslation.metaDesc,
      urlSlug: currentTranslation.urlSlug || slug,
      content: currentTranslation.content,
      wordCount: currentTranslation.wordCount,
      featuredImage,
    }),
    [currentTranslation.content, currentTranslation.metaDesc, currentTranslation.metaTitle, currentTranslation.title, currentTranslation.urlSlug, currentTranslation.wordCount, featuredImage, slug]
  )
  const filteredCalculatorOptions = useMemo(() => {
    if (!calculatorSearch.trim()) return calculatorOptions

    const query = calculatorSearch.trim().toLowerCase()
    return calculatorOptions.filter((option) =>
      option.value === "" || option.label.toLowerCase().includes(query)
    )
  }, [calculatorOptions, calculatorSearch])
  const editorSnapshot = useMemo(
    () => JSON.stringify({
      slug,
      category,
      subcategory,
      status,
      tags,
      linkedCalculatorId,
      featuredImage,
      scheduledAt,
      translations,
    }),
    [category, subcategory, featuredImage, linkedCalculatorId, scheduledAt, slug, status, tags, translations]
  )

  useEffect(() => {
    if (blogId) {
      setPersistedBlogId(blogId)
    }
  }, [blogId])

  useEffect(() => {
    let mounted = true

    async function loadCalculators() {
      setLoadingCalculators(true)
      try {
        const res = await fetch("/api/admin/calculators?limit=200")
        if (!res.ok) throw new Error("Failed to fetch calculators")
        const data = await res.json()
        const options = (data.calculators || []).map((calculator: any) => ({
          value: calculator.id,
          label: `${calculator.name} (${calculator.slug})`,
        }))

        if (mounted) {
          setCalculatorOptions([
            { value: "", label: "No linked calculator" },
            ...options,
          ])
        }
      } catch (error) {
        console.error("Failed to load calculators:", error)
      } finally {
        if (mounted) {
          setLoadingCalculators(false)
        }
      }
    }

    loadCalculators()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (effectiveBlogId || initialData || hydratedDraftRef.current) return

    hydratedDraftRef.current = true

    try {
      const rawDraft = window.localStorage.getItem(NEW_DRAFT_STORAGE_KEY)
      if (!rawDraft) return

      const draft = JSON.parse(rawDraft) as {
        slug?: string
        category?: string
        subcategory?: string
        status?: string
        tags?: string[]
        linkedCalculatorId?: string
        featuredImage?: string
        scheduledAt?: string
        translations?: Record<string, TranslationData>
      }

      if (draft.slug) setSlug(draft.slug)
      if (draft.category) setCategory(draft.category)
      if (draft.subcategory) setSubcategory(draft.subcategory)
      if (draft.status) setStatus(draft.status)
      if (draft.tags) setTags(draft.tags.join(", "))
      if (draft.linkedCalculatorId) setLinkedCalculatorId(draft.linkedCalculatorId)
      if (draft.featuredImage) setFeaturedImage(draft.featuredImage)
      if (draft.scheduledAt) setScheduledAt(draft.scheduledAt)
      if (draft.translations) {
        setTranslations((prev) => ({ ...prev, ...draft.translations }))
      }

      setAutoSaveState("saved")
      setLastSavedAt(Date.now())
    } catch (error) {
      console.error("Failed to restore local draft:", error)
    }
  }, [effectiveBlogId, initialData])

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
    
    const generated = generateSlug(title)
    if (!slug) {
      setSlug(generated)
    }
    
    if (!currentTranslation.urlSlug || currentTranslation.urlSlug === translations[activeLanguage]?.urlSlug) {
      updateTranslation("urlSlug", activeLanguage === "en" ? generated : `${activeLanguage}-${generated}`)
    }
    if (!currentTranslation.metaTitle) {
      updateTranslation("metaTitle", title.slice(0, 60))
    }
  }

  // Toast helper
  const toast = useCallback((message: string, type: "success" | "error") => {
    setShowToast({ message, type })
    setTimeout(() => setShowToast(null), 3000)
  }, [])

  const readApiError = useCallback(async (response: Response, fallback: string) => {
    try {
      const data = await response.json()
      return data.error || data.message || fallback
    } catch {
      return fallback
    }
  }, [])

  const validatePost = useCallback((targetStatus: string) => {
    if (!slug.trim()) {
      throw new Error("Blog slug is required.")
    }

    const availableTranslations = Object.values(translations).filter((translation) => translation.title.trim())
    if (availableTranslations.length === 0) {
      throw new Error("At least one language version with a title is required.")
    }

    if (targetStatus === "SCHEDULED" && !scheduledAt) {
      throw new Error("Select a schedule date and time before scheduling this post.")
    }
  }, [scheduledAt, slug, translations])

  const syncTranslations = useCallback(async (postId: string, targetStatus: string) => {
    for (const [language, translation] of Object.entries(translations)) {
      if (!translation.title.trim()) continue

      const translationRes = await fetch(`/api/admin/blog/${postId}/translations/${language}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...translation,
          title: translation.title.trim(),
          urlSlug: translation.urlSlug || `${language}-${slug.trim()}`,
          isPublished: targetStatus === "PUBLISHED" ? true : translation.isPublished,
        }),
      })

      if (!translationRes.ok) {
        throw new Error(await readApiError(translationRes, `Failed to save ${language.toUpperCase()} translation.`))
      }
    }
  }, [readApiError, slug, translations])

  const persistPost = useCallback(async (
    targetStatus: string,
    options?: { silent?: boolean; redirectOnCreate?: boolean; showToast?: boolean }
  ) => {
    const silent = options?.silent || false
    const redirectOnCreate = options?.redirectOnCreate ?? true
    validatePost(targetStatus)

    const body = {
      slug: slug.trim(),
      category: category || null,
      subcategory: subcategory || null,
      linkedCalculatorId: linkedCalculatorId || null,
      featuredImage: featuredImage || null,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: targetStatus,
      scheduledAt: targetStatus === "SCHEDULED" ? scheduledAt || null : scheduledAt || null,
      translations: Object.entries(translations)
        .filter(([, translation]) => translation.title.trim())
        .map(([language, translation]) => ({
          ...translation,
          language,
          title: translation.title.trim(),
          urlSlug: translation.urlSlug || `${language}-${slug.trim()}`,
          isPublished: targetStatus === "PUBLISHED" ? true : translation.isPublished,
        })),
    }

    if (effectiveBlogId) {
      const res = await fetch(`/api/admin/blog/${effectiveBlogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to update blog post."))
      }

      await syncTranslations(effectiveBlogId, targetStatus)

      if (!silent) {
        setLastSavedAt(Date.now())
      }

      return effectiveBlogId
    }

    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(await readApiError(res, "Failed to create blog post."))
    }

    const data = await res.json()
    if (!data.id) {
      throw new Error("Blog post was created, but no ID was returned.")
    }

    setPersistedBlogId(data.id)
    if (typeof data.slug === "string" && data.slug) {
      setSlug(data.slug)
    }
    if (Array.isArray(data.translations)) {
      setTranslations((prev) => {
        const next = { ...prev }
        for (const translation of data.translations) {
          if (!translation?.language) continue
          next[translation.language] = {
            title: translation.title || "",
            content: translation.content || "",
            metaTitle: translation.metaTitle || "",
            metaDesc: translation.metaDesc || "",
            urlSlug: translation.urlSlug || "",
            wordCount: translation.wordCount || 0,
            isPublished: translation.isPublished || false,
          }
        }
        return next
      })
    }
    window.localStorage.removeItem(NEW_DRAFT_STORAGE_KEY)

    if (!silent) {
      setLastSavedAt(Date.now())
      if (data.slugAdjusted && data.slug) {
        toast(`Slug "${data.slug}" use hua hai, kyunki original slug already taken tha.`, "success")
      }
    }

    if (redirectOnCreate) {
      router.push(`/admin/blog/${data.id}/edit`)
    }

    return data.id as string
  }, [category, effectiveBlogId, featuredImage, linkedCalculatorId, readApiError, router, scheduledAt, slug, subcategory, syncTranslations, tags, toast, translations, validatePost])

  useEffect(() => {
    if (saving || publishing) return

    if (effectiveBlogId) {
      if (!slug.trim() || editorSnapshot === lastAutosavedSnapshotRef.current) return

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          setAutoSaveState("saving")
          await persistPost(status, { silent: true, redirectOnCreate: false })
          lastAutosavedSnapshotRef.current = editorSnapshot
          setLastSavedAt(Date.now())
          setAutoSaveState("saved")
        } catch (error) {
          console.error("Autosave failed:", error)
          setAutoSaveState("error")
        }
      }, 1800)

      return () => {
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
      }
    }

    try {
      window.localStorage.setItem(NEW_DRAFT_STORAGE_KEY, JSON.stringify({
        slug,
        category,
        subcategory,
        status,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        linkedCalculatorId,
        featuredImage,
        scheduledAt,
        translations,
      }))
      setLastSavedAt(Date.now())
      setAutoSaveState("saved")
    } catch (error) {
      console.error("Failed to save local draft:", error)
      setAutoSaveState("error")
    }
  }, [category, effectiveBlogId, subcategory, editorSnapshot, featuredImage, linkedCalculatorId, persistPost, publishing, saving, scheduledAt, slug, status, tags, translations])

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

  const handleFeaturedImageDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setFeaturedDropActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await handleFeaturedImageUpload(file)
    }
  }

  const applyFeaturedImageUrl = () => {
    const nextUrl = featuredImageUrlInput.trim()
    if (!nextUrl) return
    setFeaturedImage(nextUrl)
    setFeaturedImageUrlInput("")
    toast("Featured image set from URL.", "success")
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
    setSaveError("")
    try {
      const savedId = await persistPost(status)
      toast(status === "SCHEDULED" ? "Blog post scheduled successfully!" : "Blog changes saved successfully!", "success")

      if (!effectiveBlogId && savedId) return
    } catch (err: any) {
      console.error("Save failed:", err)
      const message = err?.message || "Failed to save blog post."
      setSaveError(message)
      toast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setSaveError("")
    try {
      const savedId = await persistPost("PUBLISHED", { redirectOnCreate: false })
      const res = await fetch(`/api/admin/blog/${savedId}/publish`, { method: "POST" })
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to publish blog post."))
      }

      setStatus("PUBLISHED")
  setLastSavedAt(Date.now())
      toast("Blog post published successfully.", "success")
      if (!effectiveBlogId) {
        router.push(`/admin/blog/${savedId}/edit`)
      }
    } catch (err: any) {
      console.error("Publish failed:", err)
      const message = err?.message || "Failed to publish blog post."
      setSaveError(message)
      toast(message, "error")
    } finally {
      setPublishing(false)
    }
  }

  const previewUrl = `calculatorloop.com/${activeLanguage}/blog/${currentTranslation.urlSlug || slug || "..."}`
  const draftModeLabel = effectiveBlogId ? "Editing live draft" : "New blog draft"

  return (
    <div className="blog-editor-shell">
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
        className="blog-editor-topbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div className="blog-editor-topbar-meta" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language tabs */}
          <div
            className="blog-editor-language-tabs"
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
          <span
            style={{
              fontSize: "12px",
              color: autoSaveState === "error" ? "#f87171" : autoSaveState === "saving" ? "#facc15" : "#5a7090",
            }}
          >
            {autoSaveState === "saving" ? "Autosaving..." : autoSaveState === "error" ? "Autosave failed" : formatSavedAt(lastSavedAt)}
          </span>
        </div>

        <div className="blog-editor-actions" style={{ display: "flex", gap: "8px" }}>
          <AdminButton variant="outline" size="sm" loading={saving} onClick={handleSaveDraft}>
            💾 Save Changes
          </AdminButton>
          <AdminButton variant="primary" size="sm" loading={publishing} onClick={handlePublish}>
            🚀 Publish
          </AdminButton>
        </div>
      </div>

      <div
        className="blog-editor-preflight"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.9fr)",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "18px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(17,24,39,0.96) 56%, rgba(8,145,178,0.2) 100%)",
            border: "1px solid rgba(96,165,250,0.18)",
            boxShadow: "0 16px 40px rgba(2,6,23,0.28)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            <Badge color={effectiveBlogId ? "blue" : "purple"}>{draftModeLabel}</Badge>
            <Badge color="green">{completedTranslations}/{LANGUAGES.length} languages ready</Badge>
            <Badge color={featuredImage ? "blue" : "gray"}>{featuredImage ? "Featured media ready" : "Featured media pending"}</Badge>
          </div>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "24px", lineHeight: 1.2, color: "#f8fafc" }}>
            {currentTranslation.title || "Create a polished blog post that feels ready to publish"}
          </h2>
          <p style={{ margin: "0 0 14px 0", color: "#cbd5e1", fontSize: "14px", lineHeight: 1.7 }}>
            Copy-paste content from Docs or Word, drag screenshots directly into the article, switch languages instantly,
            and finish publishing from the same workspace on mobile or desktop.
          </p>
          <div className="blog-editor-health-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: "12px", color: "#93c5fd", marginBottom: "6px" }}>Current language</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>{activeLanguageMeta.label}</div>
            </div>
            <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: "12px", color: "#93c5fd", marginBottom: "6px" }}>Word count</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>{currentTranslation.wordCount}</div>
            </div>
            <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: "12px", color: "#93c5fd", marginBottom: "6px" }}>Preview path</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", wordBreak: "break-word" }}>{previewUrl}</div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "18px",
            borderRadius: "18px",
            background: "#131d2e",
            border: "1px solid #1c2a3d",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}>Fast creation tools</div>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
              Images can be pasted or dragged anywhere inside the editor body. Featured media also supports upload, drag-drop, and direct URL input.
            </p>
          </div>
          <div className="blog-editor-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <AdminButton variant="outline" size="sm" onClick={() => setShowImageModal(true)}>Insert Image</AdminButton>
            <AdminButton variant="outline" size="sm" onClick={() => setShowVideoModal(true)}>Insert Video</AdminButton>
            <AdminButton variant="ghost" size="sm" onClick={() => featuredInputRef.current?.click()}>Set Featured</AdminButton>
          </div>
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.14)",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#bfdbfe", marginBottom: "8px" }}>Quick workflow</div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>1. Add title, category, and slug.</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>2. Paste article content or type directly in the editor.</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>3. Drop images exactly where you want them in the story.</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>4. Finalize SEO, set schedule if needed, and publish.</div>
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.12)",
            color: "#fca5a5",
            fontSize: "13px",
          }}
        >
          {saveError}
        </div>
      )}

      {/* Main grid: Editor + Sidebar */}
      <div className="blog-editor-main" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "16px" }}>
        {/* Left: Editor */}
        <div>
          {/* Category + Subcategory + Slug */}
          <div className="blog-editor-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "12px" }}>
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
              label="Subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Loans, Mortgages (Optional)"
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
              {activeLanguageMeta.flag}
            </span>
            <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 500 }}>
              Editing: {activeLanguageMeta.label} ({activeLanguage.toUpperCase()})
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
        <div className="blog-editor-sidebar" style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "92px", alignSelf: "start" }}>
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
                onDragOver={(event) => {
                  event.preventDefault()
                  setFeaturedDropActive(true)
                }}
                onDragLeave={() => setFeaturedDropActive(false)}
                onDrop={handleFeaturedImageDrop}
                style={{
                  border: `2px dashed ${featuredDropActive ? "#60a5fa" : "#1c2a3d"}`,
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                  background: featuredDropActive ? "rgba(59,130,246,0.08)" : "transparent",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px", opacity: 0.5 }}>
                  {uploadingFeatured ? "⏳" : "📷"}
                </div>
                <p style={{ margin: 0, color: "#5a7090", fontSize: "11px" }}>
                  {uploadingFeatured ? "Uploading..." : "Click, paste URL below, or drag image here"}
                </p>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "flex-start" }}>
              <AdminInput
                value={featuredImageUrlInput}
                onChange={(e) => setFeaturedImageUrlInput(e.target.value)}
                placeholder="Paste image URL"
                style={{ marginBottom: 0 }}
              />
              <AdminButton variant="outline" size="sm" onClick={applyFeaturedImageUrl} disabled={!featuredImageUrlInput.trim()}>
                Use URL
              </AdminButton>
            </div>
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

            <AdminSelect
              label="Linked Calculator"
              value={linkedCalculatorId}
              onChange={(e) => setLinkedCalculatorId(e.target.value)}
              options={filteredCalculatorOptions}
              hint={loadingCalculators ? "Loading calculator list..." : "Attach this blog to a calculator for internal linking."}
            />

            <AdminInput
              label="Search Calculators"
              value={calculatorSearch}
              onChange={(e) => setCalculatorSearch(e.target.value)}
              placeholder="Type calculator name or slug"
              hint={`${Math.max(filteredCalculatorOptions.length - 1, 0)} calculator options visible`}
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
                Save Changes
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
                  {previewUrl}
                </strong>
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#131d2e",
              borderRadius: "10px",
              border: "1px solid #1c2a3d",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>
              ⚡ Content Health
            </h4>
            <div className="blog-editor-health-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.12)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>{completedTranslations}/{LANGUAGES.length}</div>
                <div style={{ fontSize: "11px", color: "#5a7090" }}>Languages ready</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>{seoReadyLanguages}</div>
                <div style={{ fontSize: "11px", color: "#5a7090" }}>SEO-ready langs</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.12)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>{featuredImage ? "Yes" : "No"}</div>
                <div style={{ fontSize: "11px", color: "#5a7090" }}>Featured image</div>
              </div>
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>{currentTranslation.wordCount}</div>
                <div style={{ fontSize: "11px", color: "#5a7090" }}>Words in {activeLanguage.toUpperCase()}</div>
              </div>
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

            <div
              style={{
                marginBottom: "14px",
                padding: "12px",
                borderRadius: "10px",
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#93c5fd" }}>SEO Score</span>
                <Badge color={seoInsight.score >= 85 ? "green" : seoInsight.score >= 65 ? "blue" : seoInsight.score >= 45 ? "yellow" : "red"}>
                  {seoInsight.score}/100 {seoInsight.grade}
                </Badge>
              </div>
              <div style={{ height: "8px", borderRadius: "999px", background: "rgba(15,22,35,0.8)", overflow: "hidden", marginBottom: "10px" }}>
                <div
                  style={{
                    width: `${seoInsight.score}%`,
                    height: "100%",
                    background: seoInsight.score >= 85 ? "#22c55e" : seoInsight.score >= 65 ? "#3b82f6" : seoInsight.score >= 45 ? "#eab308" : "#ef4444",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {seoInsight.checks.map((check) => (
                  <Badge key={check} color="blue">{check}</Badge>
                ))}
              </div>
            </div>

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
                  {previewUrl}
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

        .blog-editor-shell {
          width: 100%;
        }

        @media (max-width: 1180px) {
          .blog-editor-preflight,
          .blog-editor-main {
            grid-template-columns: 1fr !important;
          }

          .blog-editor-sidebar {
            position: static !important;
            top: auto !important;
          }
        }

        @media (max-width: 820px) {
          .blog-editor-topbar,
          .blog-editor-topbar-meta,
          .blog-editor-actions {
            flex-direction: column;
            align-items: stretch !important;
          }

          .blog-editor-language-tabs {
            overflow-x: auto;
            padding-bottom: 4px !important;
          }

          .blog-editor-meta-grid,
          .blog-editor-health-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
