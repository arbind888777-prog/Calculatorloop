import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  accountRecoverySchema,
  validateAndSanitize,
} from "@/lib/security/validation"
import { getClientIdentifier, withRateLimit } from "@/lib/security/rateLimit"
import {
  hasSqlInjection,
  hasXssPattern,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
} from "@/lib/security/sanitize"
import {
  sendAccountRecoveryAcknowledgement,
  sendAccountRecoverySupportEmail,
} from "@/lib/email"

const GENERIC_SUCCESS_MESSAGE =
  "Recovery request received. Our support team will review it and reply to your contact email."

export async function POST(req: Request) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimit = withRateLimit(clientId, "accountRecovery")

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      )
    }

    const body = await req.json()
    const validation = validateAndSanitize(accountRecoverySchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      )
    }

    const {
      name,
      contactEmail,
      loginHint,
      phone,
      message,
    } = validation.data
    const accountType = validation.data.accountType || "user"

    const normalizedName = sanitizeText(name)
    const normalizedContactEmail = sanitizeEmail(contactEmail)
    const normalizedLoginHint = sanitizeText(loginHint || "")
    const normalizedPhone = sanitizePhone(phone || "")
    const normalizedMessage = sanitizeText(message)

    if (
      hasSqlInjection(normalizedName) ||
      hasSqlInjection(normalizedLoginHint) ||
      hasSqlInjection(normalizedMessage) ||
      hasXssPattern(normalizedName) ||
      hasXssPattern(normalizedLoginHint) ||
      hasXssPattern(normalizedMessage)
    ) {
      return NextResponse.json(
        { error: "Invalid input detected" },
        { status: 400 }
      )
    }

    const details = {
      accountType,
      contactEmail: normalizedContactEmail,
      loginHint: normalizedLoginHint || null,
      phone: normalizedPhone || null,
      message: normalizedMessage,
      source: "self_service_account_recovery",
    }

    await prisma.activityLog.create({
      data: {
        action: "auth.account_recovery_requested",
        entityType: "auth",
        details: JSON.stringify(details),
      },
    }).catch(() => null)

    await sendAccountRecoverySupportEmail({
      accountType,
      name: normalizedName,
      contactEmail: normalizedContactEmail,
      loginHint: normalizedLoginHint || undefined,
      phone: normalizedPhone || undefined,
      message: normalizedMessage,
    }).catch((error) => {
      console.error("Account recovery support email failed:", error)
      return null
    })

    await sendAccountRecoveryAcknowledgement(
      normalizedContactEmail,
      normalizedName,
      accountType
    ).catch((error) => {
      console.error("Account recovery acknowledgement failed:", error)
      return null
    })

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE })
  } catch (error) {
    console.error("Account recovery error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
