"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSettings } from "@/components/providers/SettingsProvider"
import { TurnstileWidget } from "@/components/security/TurnstileWidget"

type AccountType = "user" | "admin"
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

export default function AccountRecoveryClient() {
  const searchParams = useSearchParams()
  const { language } = useSettings()
  const prefix = language === "en" ? "" : `/${language}`
  const withLocale = (path: string) => `${prefix}${path}`

  const initialType = useMemo<AccountType>(() => {
    return searchParams?.get("type") === "admin" ? "admin" : "user"
  }, [searchParams])

  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    accountType: initialType,
    name: "",
    contactEmail: "",
    loginHint: "",
    phone: "",
    message: "",
    turnstileToken: "",
  })

  const forgotPasswordHref =
    formData.accountType === "admin"
      ? "/forgot-password?type=admin"
      : withLocale("/forgot-password")

  const loginHref =
    formData.accountType === "admin"
      ? "/admin/login"
      : withLocale("/login")

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (turnstileSiteKey && !formData.turnstileToken) {
      toast.error("Please complete the security check first.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/account-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit recovery request")
      }

      toast.success(data.message || "Recovery request submitted")
      setSubmitted(true)
      setFormData({
        accountType: initialType,
        name: "",
        contactEmail: "",
        loginHint: "",
        phone: "",
        message: "",
        turnstileToken: "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to submit recovery request")
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Recovery request received</CardTitle>
            <CardDescription>
              We&apos;ll review your details and reply to your contact email after verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you remember your login email later, you can directly use the password reset form for faster access.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={forgotPasswordHref} className="flex-1">
                <Button className="w-full" variant="outline">Reset Password Instead</Button>
              </Link>
              <Link href={loginHref} className="flex-1">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Account Recovery</CardTitle>
          <CardDescription>
            If you forgot your login email, we handle recovery through support verification instead of revealing it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Use <Link href={forgotPasswordHref} className="font-medium text-primary">password reset</Link> if you still know your account email. Use this form when you no longer remember the login email or need manual recovery help.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="accountType">Account type</Label>
              <select
                id="accountType"
                value={formData.accountType}
                onChange={(e) => handleChange("accountType", e.target.value)}
                disabled={isLoading}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="user">Normal User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Your full name"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="Email where support should reply"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Label htmlFor="loginHint">Last remembered login email or hint</Label>
              <Input
                id="loginHint"
                value={formData.loginHint}
                onChange={(e) => handleChange("loginHint", e.target.value)}
                placeholder="example@..., work email, old domain, etc."
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone number (optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+91..."
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="message">What do you remember about the account?</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Share enough detail so support can verify safely: possible email, account role, when you last used it, billing or profile clues, etc."
                disabled={isLoading}
                required
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.message.length}/1000 characters
              </p>
            </div>

            {turnstileSiteKey ? (
              <div>
                <Label className="mb-2 block">Security check</Label>
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  action="account_recovery"
                  onVerify={(token) => handleChange("turnstileToken", token)}
                />
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Recovery Request"}
            </Button>

            <div className="flex justify-between text-sm">
              <Link href={forgotPasswordHref} className="font-medium text-primary hover:text-primary/90">
                I remember my email
              </Link>
              <Link href={loginHref} className="font-medium text-primary hover:text-primary/90">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
