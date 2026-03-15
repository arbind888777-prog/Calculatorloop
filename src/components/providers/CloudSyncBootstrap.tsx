"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCloudSync } from "@/hooks/useCloudSync"

export function CloudSyncBootstrap() {
  const router = useRouter()
  const { status } = useSession()
  const hasSyncedRef = useRef(false)
  const { performFullSync } = useCloudSync({ autoSync: false })

  useEffect(() => {
    if (status !== "authenticated" || hasSyncedRef.current) {
      return
    }

    hasSyncedRef.current = true

    void performFullSync().finally(() => {
      router.refresh()
    })
  }, [status, performFullSync, router])

  return null
}