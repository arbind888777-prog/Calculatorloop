import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sanitizeEmail } from "@/lib/security/sanitize"
import { normalizeSiteUrl } from "@/lib/siteUrl"
import { checkRateLimit } from "@/lib/security/rateLimit"

const hasGoogleOAuth =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET

const canonicalSiteUrl = normalizeSiteUrl(
  process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
)

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0"
}

function normalizeAuthRedirectUrl(url: string, baseUrl: string) {
  const resolvedBaseUrl = normalizeSiteUrl(baseUrl || canonicalSiteUrl)
  const fallbackUrl = new URL(resolvedBaseUrl)

  try {
    const targetUrl = new URL(url, resolvedBaseUrl)

    if (isLocalDevHost(targetUrl.hostname)) {
      return `${targetUrl.origin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    }

    if (targetUrl.host === fallbackUrl.host) {
      return `${fallbackUrl.origin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    }
  } catch {
    return resolvedBaseUrl
  }

  return resolvedBaseUrl
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error(code, metadata)
    },
    warn(code) {
      console.warn(code)
    },
    debug(code, metadata) {
      console.debug(code, metadata)
    },
  },
  providers: [
    ...(hasGoogleOAuth
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = sanitizeEmail(credentials.email)

        // Rate-limit login attempts per email to prevent brute-force
        const rateCheck = checkRateLimit(email, "adminLogin")
        if (!rateCheck.allowed) {
          throw new Error(`Too many login attempts. Try again in ${rateCheck.retryAfter} seconds.`)
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    // NOTE: Role handling is defined in the later callbacks (session & jwt). The duplicate definitions have been removed.
    redirect: ({ url, baseUrl }) => {
      return normalizeAuthRedirectUrl(url, baseUrl)
    },
    session: ({ session, token }) => {
      // Merge id and role into session.user
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      }
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        // Fetch the role from the database for accurate role assignment
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.role = dbUser?.role || "USER"
      }
      return token
    },
  },
}

// ============================================================
// Admin auth helper utilities
// ============================================================

/**
 * Check if a user role has admin access (SUPER_ADMIN or EDITOR).
 */
export function isAdminRole(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "EDITOR"
}

/**
 * Check if a user role is specifically SUPER_ADMIN.
 */
export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN"
}

/**
 * Check if a user role is EDITOR.
 */
export function isEditor(role?: string | null): boolean {
  return role === "EDITOR"
}

/**
 * Check if a user role has at least viewer access.
 */
export function hasAdminAccess(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "EDITOR" || role === "VIEWER"
}
