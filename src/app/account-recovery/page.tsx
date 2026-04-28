import { Suspense } from "react"
import { Metadata } from "next"
import AccountRecoveryClient from "./AccountRecoveryClient"

export const metadata: Metadata = {
  title: "Account Recovery | Calculator Loop",
  description: "Recover access when you no longer remember your login email or need support help.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountRecoveryPage() {
  return (
    <Suspense fallback={null}>
      <AccountRecoveryClient />
    </Suspense>
  )
}
