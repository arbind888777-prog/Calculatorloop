import { redirect } from "next/navigation"

export default function SecureAdminAccessPage() {
  redirect("/admin/login")
}