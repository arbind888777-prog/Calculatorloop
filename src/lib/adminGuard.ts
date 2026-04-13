/**
 * adminGuard.ts
 * Shared helper to enforce role-based access on admin API routes.
 *
 * Usage:
 *   const guard = await requireAdmin("editor")   // SUPER_ADMIN | EDITOR
 *   if (!guard.ok) return guard.response
 *   // guard.session is now available
 */

import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { NextResponse } from "next/server"

type MinRole = "viewer" | "editor" | "superadmin"

const ALLOWED: Record<MinRole, string[]> = {
  viewer: ["SUPER_ADMIN", "EDITOR", "VIEWER"],
  editor: ["SUPER_ADMIN", "EDITOR"],
  superadmin: ["SUPER_ADMIN"],
}

type GuardSuccess = { ok: true; session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; response?: never }
type GuardFail = { ok: false; response: NextResponse; session?: never }
type GuardResult = GuardSuccess | GuardFail

export async function requireAdmin(minRole: MinRole = "viewer"): Promise<GuardResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const role = (session.user as { role?: string }).role ?? "USER"

  if (!ALLOWED[minRole].includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      ),
    }
  }

  return { ok: true, session }
}
