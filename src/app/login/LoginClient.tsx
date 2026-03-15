"use client"

import { useEffect, useMemo, useState } from "react"
import { getProviders, signIn, useSession, type ClientSafeProvider } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { useSettings } from "@/components/providers/SettingsProvider"

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const { language } = useSettings()
  const prefix = language === 'en' ? '' : `/${language}`
  const withLocale = (path: string) => `${prefix}${path}`

  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    let mounted = true
    getProviders()
      .then((p) => {
        if (mounted) setProviders(p)
      })
      .catch(() => {
        if (mounted) setProviders(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  const callbackUrl = useMemo(() => {
    const raw = searchParams?.get('callbackUrl') || ''
    if (!raw) return ''
    try {
      // Allow same-origin absolute URLs and relative paths only.
      if (raw.startsWith('/')) return raw
      const url = new URL(raw)
      if (url.origin === window.location.origin) return url.pathname + url.search + url.hash
      return ''
    } catch {
      return ''
    }
  }, [searchParams])

  useEffect(() => {
    if (status !== "authenticated") {
      return
    }

    router.replace(callbackUrl || withLocale("/"))
    router.refresh()
  }, [status, callbackUrl, router, language])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const callback = await signIn("credentials", {
        ...data,
        redirect: false,
        callbackUrl: callbackUrl || withLocale('/'),
      })

      if (callback?.error) {
        toast.error(callback.error === "CredentialsSignin" ? "Invalid credentials" : callback.error)
      }

      if (callback?.ok && !callback?.error) {
        toast.success("Logged in successfully!")
        const target = callbackUrl || withLocale("/")
        router.replace(target)
        router.refresh()
      }
    } catch (error) {
      toast.error("Something went wrong!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border">
          <form className="space-y-6" onSubmit={login}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!providers?.google}
                title={!providers?.google ? 'Google sign-in is not configured' : undefined}
                onClick={() => {
                  if (!providers?.google) {
                    toast.error('Google sign-in is not configured')
                    return
                  }
                  signIn('google', { callbackUrl: callbackUrl || withLocale('/') })
                }}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Google
              </Button>
            </div>

            <div className="mt-6 flex justify-center text-sm">
              <Link
                href={withLocale("/register")}
                className="font-medium text-primary hover:text-primary/90"
              >
                Don't have an account? Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
