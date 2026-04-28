"use client"

import { useEffect, useId, useRef } from "react"
import Script from "next/script"

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          action?: string
          theme?: "auto" | "light" | "dark"
          callback?: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
        }
      ) => string
      remove?: (widgetId: string) => void
    }
  }
}

type TurnstileWidgetProps = {
  siteKey: string
  action: string
  onVerify: (token: string) => void
  theme?: "auto" | "light" | "dark"
}

export function TurnstileWidget({
  siteKey,
  action,
  onVerify,
  theme = "dark",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const id = useId()

  useEffect(() => {
    function renderWidget() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
        return
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify(""),
      })
    }

    renderWidget()

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, onVerify, siteKey, theme])

  return (
    <>
      <Script
        id={`turnstile-script-${id}`}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  )
}
