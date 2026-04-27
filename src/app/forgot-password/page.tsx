import { Metadata } from "next"
import ForgotPasswordClient from "./ForgotPasswordClient"

export const metadata: Metadata = {
  title: "Forgot Password | Calculator Loop",
  description: "Reset your password",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
