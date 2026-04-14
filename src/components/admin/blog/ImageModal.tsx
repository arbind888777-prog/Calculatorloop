"use client"

import { useState, useCallback, useRef } from "react"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (url: string, alt?: string) => void
}

type TabType = "upload" | "url"

export function ImageModal({ isOpen, onClose, onInsert }: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upload")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [altText, setAltText] = useState("")
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setPreviewUrl("")
    setImageUrl("")
    setAltText("")
    setError("")
    setUploading(false)
    setUploadProgress(0)
    setIsDragging(false)
  }, [])

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleUploadFile = useCallback(
    async (file: File) => {
      // Validate
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!allowed.includes(file.type)) {
        setError("Invalid file type. Allowed: JPG, PNG, WebP, GIF")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum 10MB.")
        return
      }

      setError("")
      setUploading(true)
      setUploadProgress(20)

      // Show local preview
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)
      setAltText(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "))

      const formData = new FormData()
      formData.append("file", file)

      try {
        setUploadProgress(50)
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })
        setUploadProgress(80)

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Upload failed")
        }

        const data = await res.json()
        setUploadProgress(100)
        setImageUrl(data.url)

        // Revoke local preview, use server URL
        URL.revokeObjectURL(localPreview)
        setPreviewUrl(data.url)
      } catch (err: any) {
        setError(err.message || "Upload failed. Try again.")
        URL.revokeObjectURL(localPreview)
        setPreviewUrl("")
      } finally {
        setUploading(false)
      }
    },
    []
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUploadFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUploadFile(file)
  }

  const handleUrlPreview = () => {
    if (imageUrl) {
      setPreviewUrl(imageUrl)
      setError("")
    }
  }

  const handleInsert = () => {
    const url = imageUrl
    if (!url) {
      setError("No image selected or URL provided")
      return
    }
    onInsert(url, altText || undefined)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(540px, 92vw)",
          maxHeight: "85vh",
          background: "#0f1623",
          borderRadius: "16px",
          border: "1px solid #1c2a3d",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #1c2a3d",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>📷</span>
            Insert Image
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px 8px",
              fontSize: "16px",
              lineHeight: 1,
              transition: "all 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            padding: "12px 20px 0",
          }}
        >
          {(
            [
              { key: "upload", icon: "⬆️", label: "Upload" },
              { key: "url", icon: "🔗", label: "From URL" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setError("")
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                fontSize: "12px",
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "#e2e8f0" : "#5a7090",
                background:
                  activeTab === tab.key
                    ? "rgba(59,130,246,0.12)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "14px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Error */}
          {error && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                color: "#f87171",
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Upload tab */}
          {activeTab === "upload" && (
            <div>
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "#3b82f6" : "#1c2a3d"}`,
                  borderRadius: "12px",
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isDragging
                    ? "rgba(59,130,246,0.06)"
                    : "rgba(15,22,35,0.5)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "8px", opacity: 0.7 }}>
                  {uploading ? "⏳" : isDragging ? "📥" : "🖼️"}
                </div>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {uploading
                    ? "Uploading..."
                    : isDragging
                      ? "Drop image here"
                      : "Drag & drop image here"}
                </p>
                <p style={{ margin: 0, color: "#5a7090", fontSize: "11px" }}>
                  or click to browse • JPG, PNG, WebP, GIF • Max 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>

              {/* Upload progress */}
              {uploading && (
                <div style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      height: "4px",
                      background: "#1c2a3d",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                        borderRadius: "2px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "#5a7090",
                      textAlign: "center",
                    }}
                  >
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* URL tab */}
          {activeTab === "url" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Image URL
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlPreview()}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    background: "#131d2e",
                    border: "1px solid #1c2a3d",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                />
                <button
                  onClick={handleUrlPreview}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "8px",
                    color: "#60a5fa",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Preview
              </label>
              <div
                style={{
                  background: "#131d2e",
                  borderRadius: "10px",
                  border: "1px solid #1c2a3d",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={altText || "Preview"}
                  onError={() => {
                    setError("Failed to load image. Check the URL.")
                    setPreviewUrl("")
                  }}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "220px",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Alt text */}
              <div style={{ marginTop: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  placeholder="Describe this image..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#131d2e",
                    border: "1px solid #1c2a3d",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            padding: "12px 20px",
            borderTop: "1px solid #1c2a3d",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "8px 18px",
              background: "transparent",
              border: "1px solid #1c2a3d",
              borderRadius: "8px",
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!imageUrl && !previewUrl}
            style={{
              padding: "8px 20px",
              background:
                imageUrl || previewUrl
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "#1c2a3d",
              border: "none",
              borderRadius: "8px",
              color: imageUrl || previewUrl ? "#fff" : "#5a7090",
              fontSize: "12px",
              fontWeight: 600,
              cursor: imageUrl || previewUrl ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow:
                imageUrl || previewUrl
                  ? "0 2px 8px rgba(59,130,246,0.25)"
                  : "none",
            }}
          >
            Insert Image
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </>
  )
}
