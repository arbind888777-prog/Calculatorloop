import bcrypt from "bcryptjs"
import { createHash } from "crypto"

const SALT_ROUNDS = 12

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Hash a password-reset token before storing it in the database.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
