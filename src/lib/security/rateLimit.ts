/**
 * Rate Limiting for Forms and Endpoints
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

type HeaderSource = Headers | Record<string, string | string[] | undefined>

type RequestLike = {
  headers?: HeaderSource
} | Request

function readHeader(headers: HeaderSource | undefined, name: string): string | undefined {
  if (!headers) return undefined

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) ?? undefined
  }

  const normalizedName = name.toLowerCase()
  const value = (headers as Record<string, string | string[] | undefined>)[normalizedName]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limit configuration per endpoint
 */
export const RATE_LIMIT_CONFIG = {
  contact: { requests: 5, window: 3600 }, // 5 requests per hour
  register: { requests: 3, window: 3600 }, // 3 requests per hour
  login: { requests: 10, window: 900 }, // 10 requests per 15 minutes
  adminLogin: { requests: 5, window: 900 }, // 5 attempts per 15 minutes for admin
  newsletter: { requests: 2, window: 3600 }, // 2 requests per hour
  apiKeyCreate: { requests: 5, window: 3600 }, // 5 API keys per hour
  passwordReset: { requests: 3, window: 3600 }, // 3 password resets per hour
};

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIG
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const config = RATE_LIMIT_CONFIG[endpoint];
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  let data = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + config.window * 1000,
    };
    rateLimitStore.set(key, data);
  }

  // Increment count
  data.count++;

  const allowed = data.count <= config.requests;
  const remaining = Math.max(0, config.requests - data.count);
  const retryAfter = allowed ? undefined : Math.ceil((data.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: data.resetTime,
    retryAfter,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: RequestLike): string {
  // Try to get real IP from headers
  const headers = request.headers;
  const forwardedFor = readHeader(headers, 'x-forwarded-for');
  const realIp = readHeader(headers, 'x-real-ip');
  const cfConnectingIp = readHeader(headers, 'cf-connecting-ip');

  // Use the first available IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';

  return ip.trim();
}

/**
 * Cleanup expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();

  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime + 60000) {
      // Keep for 1 extra minute
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIG
): { success: true } | { success: false; error: string; retryAfter: number } {
  const result = checkRateLimit(identifier, endpoint);

  if (!result.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter!,
    };
  }

  return { success: true };
}

/**
 * Reset rate limit for an identifier (useful for testing or admin override)
 */
export function resetRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIG
): void {
  const key = `${endpoint}:${identifier}`;
  rateLimitStore.delete(key);
}
