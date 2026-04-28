type TurnstileVerificationResponse = {
  success: boolean
  "error-codes"?: string[]
  action?: string
  hostname?: string
}

type VerifyTurnstileOptions = {
  token?: string
  remoteIp?: string
  expectedAction?: string
}

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    process.env.TURNSTILE_SECRET_KEY
  )
}

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
  expectedAction,
}: VerifyTurnstileOptions): Promise<{ success: true } | { success: false; error: string }> {
  if (!isTurnstileConfigured()) {
    return { success: true }
  }

  if (!token) {
    return { success: false, error: "Complete the security check and try again." }
  }

  try {
    const payload = new URLSearchParams()
    payload.set("secret", process.env.TURNSTILE_SECRET_KEY!)
    payload.set("response", token)
    if (remoteIp) {
      payload.set("remoteip", remoteIp)
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      cache: "no-store",
    })

    const data = await response.json() as TurnstileVerificationResponse

    if (!response.ok || !data.success) {
      console.error("Turnstile verification failed:", data["error-codes"] || data)
      return { success: false, error: "Security verification failed. Please try again." }
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      console.error("Turnstile action mismatch:", data.action, expectedAction)
      return { success: false, error: "Security verification failed. Please refresh and retry." }
    }

    return { success: true }
  } catch (error) {
    console.error("Turnstile verification error:", error)
    return { success: false, error: "Security verification is temporarily unavailable." }
  }
}
