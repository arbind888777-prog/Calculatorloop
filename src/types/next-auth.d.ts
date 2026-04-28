import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
interface Session {
    error?: "SESSION_REVOKED"
    user: {
      /** The user's id. */
      id: string
      /** The user's role. */
      role: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    role?: string
    passwordChangedAt?: number | null
    sessionRevoked?: boolean
  }
}
