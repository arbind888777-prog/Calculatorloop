"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { useSettings } from "@/components/providers/SettingsProvider"
import { TurnstileWidget } from "@/components/security/TurnstileWidget"

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [previewResetLink, setPreviewResetLink] = useState("")
  const [previewFilePath, setPreviewFilePath] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const { language } = useSettings()
  const prefix = language === 'en' ? '' : `/${language}`
  const withLocale = (path: string) => `${prefix}${path}`
  const isAdminRecovery = searchParams?.get("type") === "admin"
  const recoveryHref = withLocale(`/account-recovery${isAdminRecovery ? "?type=admin" : ""}`)
  const loginHref = isAdminRecovery ? "/admin/login" : withLocale("/login")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (turnstileSiteKey && !turnstileToken) {
      toast.error("Please complete the security check first.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setPreviewResetLink(data.previewResetLink || "")
      setPreviewFilePath(data.previewFilePath || "")
      toast.success(data.message || "Reset link sent!")
      setEmail("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {isAdminRecovery ? "Admin Password Reset" : "Forgot Password"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your account email and we will send you a reset link.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          We never send your old password by email. You will create a new password using a one-time secure link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border">
          <div className="mb-6 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            Don&apos;t remember the login email? Use{" "}
            <Link href={recoveryHref} className="font-medium text-primary hover:text-primary/90">
              account recovery
            </Link>{" "}
            so support can verify your identity safely.
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {turnstileSiteKey ? (
              <div>
                <Label className="mb-2 block">Security check</Label>
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  action="forgot_password"
                  onVerify={setTurnstileToken}
                />
              </div>
            ) : null}

            <div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </div>
          </form>

          {previewResetLink && (
            <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-300">Local development preview</p>
              <p className="mt-1 text-amber-100/90">
                Email provider configured nahi hai, isliye reset email local preview ke roop me save hua hai.
              </p>
              <a
                href={previewResetLink}
                className="mt-3 block break-all font-medium text-cyan-300 hover:text-cyan-200"
              >
                Open reset link
              </a>
              {previewFilePath && (
                <p className="mt-2 break-all text-xs text-amber-100/80">
                  Saved preview: <span className="font-mono">{previewFilePath}</span>
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center text-sm space-x-4">
              <Link
                href={loginHref}
                className="font-medium text-primary hover:text-primary/90"
              >
                Back to Login
              </Link>
              <Link
                href={recoveryHref}
                className="font-medium text-primary hover:text-primary/90"
              >
                Forgot email?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
