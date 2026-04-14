"use client"

import { useState, useCallback, useRef } from "react"

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertYoutube: (url: string) => void
  onInsertUpload: (url: string) => void
}

type TabType = "youtube" | "upload" | "url"

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function VideoModal({ isOpen, onClose, onInsertYoutube, onInsertUpload }: VideoModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const youtubeId = extractYoutubeId(youtubeUrl)

  const resetState = useCallback(() => {
    setYoutubeUrl("")
    setVideoUrl("")
    setError("")
    setUploading(false)
    setUploadProgress(0)
    setIsDragging(false)
    setUploadedUrl("")
  }, [])

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleUploadFile = useCallback(async (file: File) => {
    const allowed = ["video/mp4", "video/webm"]
    if (!allowed.includes(file.type)) {
      setError("Invalid file type. Allowed: MP4, WebM")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum 50MB.")
      return
    }

    setError("")
    setUploading(true)
    setUploadProgress(20)

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadProgress(40)
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
      setUploadedUrl(data.url)
    } catch (err: any) {
      setError(err.message || "Upload failed. Try again.")
    } finally {
      setUploading(false)
    }
  }, [])

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

  const handleInsert = () => {
    if (activeTab === "youtube") {
      if (!youtubeUrl || !youtubeId) {
        setError("Please enter a valid YouTube URL")
        return
      }
      onInsertYoutube(youtubeUrl)
    } else if (activeTab === "upload") {
      if (!uploadedUrl) {
        setError("No video uploaded yet")
        return
      }
      onInsertUpload(uploadedUrl)
    } else if (activeTab === "url") {
      if (!videoUrl) {
        setError("Please enter a video URL")
        return
      }
      onInsertUpload(videoUrl)
    }
    handleClose()
  }

  const canInsert =
    (activeTab === "youtube" && !!youtubeId) ||
    (activeTab === "upload" && !!uploadedUrl) ||
    (activeTab === "url" && !!videoUrl)

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
          width: "min(560px, 92vw)",
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
            <span style={{ fontSize: "18px" }}>🎬</span>
            Insert Video
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
              { key: "youtube", icon: "▶️", label: "YouTube" },
              { key: "upload", icon: "⬆️", label: "Upload" },
              { key: "url", icon: "🔗", label: "Direct URL" },
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
                    ? "rgba(239,68,68,0.1)"
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

          {/* YouTube tab */}
          {activeTab === "youtube" && (
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
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value)
                  setError("")
                }}
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

              {/* YouTube preview */}
              {youtubeId && (
                <div style={{ marginTop: "14px" }}>
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
                      padding: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        height: 0,
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube preview"
                      />
                    </div>
                  </div>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "11px",
                      color: "#5a7090",
                    }}
                  >
                    Video ID: <span style={{ color: "#60a5fa" }}>{youtubeId}</span>
                  </p>
                </div>
              )}
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
                  border: `2px dashed ${isDragging ? "#ef4444" : "#1c2a3d"}`,
                  borderRadius: "12px",
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isDragging
                    ? "rgba(239,68,68,0.06)"
                    : "rgba(15,22,35,0.5)",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "8px",
                    opacity: 0.7,
                  }}
                >
                  {uploading ? "⏳" : isDragging ? "📥" : "🎥"}
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
                      ? "Drop video here"
                      : "Drag & drop video here"}
                </p>
                <p style={{ margin: 0, color: "#5a7090", fontSize: "11px" }}>
                  or click to browse • MP4, WebM • Max 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
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
                        background: "linear-gradient(90deg, #ef4444, #f87171)",
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

              {/* Uploaded success */}
              {uploadedUrl && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>✅</span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#4ade80",
                      }}
                    >
                      Video uploaded successfully
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "11px",
                        color: "#5a7090",
                        wordBreak: "break-all",
                      }}
                    >
                      {uploadedUrl}
                    </p>
                  </div>
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
                Video URL (Direct Link)
              </label>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  setError("")
                }}
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
              <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#5a7090" }}>
                Enter a direct URL to an MP4 or WebM video file.
                The video will be embedded with an HTML5 video player.
              </p>

              {/* Video preview */}
              {videoUrl && (
                <div style={{ marginTop: "14px" }}>
                  <div
                    style={{
                      background: "#131d2e",
                      borderRadius: "10px",
                      border: "1px solid #1c2a3d",
                      padding: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <video
                      src={videoUrl}
                      controls
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        maxHeight: "240px",
                      }}
                    />
                  </div>
                </div>
              )}
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
            disabled={!canInsert}
            style={{
              padding: "8px 20px",
              background: canInsert
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "#1c2a3d",
              border: "none",
              borderRadius: "8px",
              color: canInsert ? "#fff" : "#5a7090",
              fontSize: "12px",
              fontWeight: 600,
              cursor: canInsert ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow: canInsert
                ? "0 2px 8px rgba(239,68,68,0.25)"
                : "none",
            }}
          >
            {activeTab === "youtube" ? "Embed Video" : "Insert Video"}
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
