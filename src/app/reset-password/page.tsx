import { Metadata } from "next"
import ResetPasswordClient from "./ResetPasswordClient"

export const metadata: Metadata = {
  title: "Reset Password | Calculator Loop",
  description: "Set a new password",
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
