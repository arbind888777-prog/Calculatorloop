import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient"

export const metadata = {
  title: "Admin Panel — CalculatorLoop",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/admin/login")
  }

  const role = (session?.user as any)?.role
  const hasAccess =
    role === "SUPER_ADMIN" || role === "EDITOR" || role === "VIEWER"

  if (!hasAccess) {
    redirect("/")
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
