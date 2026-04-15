'use client'

import dynamic from 'next/dynamic'

const ClarityScript = dynamic(() => import('@/components/analytics/ClarityScript'), { ssr: false })
const OfflineIndicator = dynamic(
  () => import('@/components/pwa/OfflineIndicator').then((mod) => ({ default: mod.OfflineIndicator })),
  { ssr: false }
)
const InstallPrompt = dynamic(
  () => import('@/components/pwa/InstallPrompt').then((mod) => ({ default: mod.InstallPrompt })),
  { ssr: false }
)
const PushNotificationPrompt = dynamic(
  () => import('@/components/pwa/PushNotificationPrompt').then((mod) => ({ default: mod.PushNotificationPrompt })),
  { ssr: false }
)


export function DeferredClientBits() {
  return (
    <>
      <ClarityScript />
      <OfflineIndicator />
      <InstallPrompt />
      <PushNotificationPrompt />

    </>
  )
}
