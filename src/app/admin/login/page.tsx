"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080d1a 0%, #0a1628 50%, #0d1f3c 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "420px", padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "36px",
              marginBottom: "8px",
            }}
          >
            ⚡
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#e2e8f0",
              margin: "0 0 4px 0",
              letterSpacing: "-0.5px",
            }}
          >
            CalculatorLoop
          </h1>
          <p style={{ color: "#5a7090", fontSize: "14px", margin: 0 }}>
            Admin Panel
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "#131d2e",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid #1c2a3d",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#e2e8f0",
              margin: "0 0 24px 0",
            }}
          >
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#fca5a5",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Email field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="admin-email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#94a3b8",
                  marginBottom: "6px",
                }}
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@calculatorloop.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0f1623",
                  border: "1px solid #1c2a3d",
                  borderRadius: "10px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#1c2a3d"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="admin-password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#94a3b8",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0f1623",
                  border: "1px solid #1c2a3d",
                  borderRadius: "10px",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6"
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#1c2a3d"
                  e.target.style.boxShadow = "none"
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: loading
                  ? "#1e3a5f"
                  : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
                boxShadow: loading
                  ? "none"
                  : "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#3a4f6b",
            fontSize: "12px",
            marginTop: "24px",
          }}
        >
            © {new Date().getFullYear()} CalculatorLoop. Protected admin area.
          </p>
        </div>

        <style>{`
          @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#080d1a", color: "#e2e8f0" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
