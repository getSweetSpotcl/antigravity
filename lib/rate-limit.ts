/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, consider using Redis
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  limit: number
  /** Time window in seconds */
  windowInSeconds: number
  /** Identifier for this rate limiter (e.g., route name) */
  identifier?: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  headers: Record<string, string>
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (usually IP or user ID)
 * @param options - Rate limit options
 * @returns Result with success status and rate limit info
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowInSeconds, identifier = "default" } = options
  const now = Date.now()
  const windowMs = windowInSeconds * 1000
  const fullKey = `${identifier}:${key}`

  let entry = rateLimitMap.get(fullKey)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitMap.set(fullKey, entry)

    return {
      success: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(limit - 1),
        "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
      },
    }
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, limit - entry.count)
  const success = entry.count <= limit

  return {
    success,
    remaining,
    resetAt: entry.resetAt,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
      ...(success ? {} : { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) }),
    },
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  // Fallback
  return "unknown"
}

/**
 * Get client IP from Next.js headers (for Server Actions)
 * @param headersMap - Headers object from next/headers
 */
export function getClientIPFromHeaders(headersMap: Headers): string {
  // Check common proxy headers (Vercel, Cloudflare, etc.)
  const forwarded = headersMap.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  const realIP = headersMap.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  // Vercel specific
  const vercelIP = headersMap.get("x-vercel-forwarded-for")
  if (vercelIP) {
    return vercelIP.split(",")[0].trim()
  }

  // Fallback
  return "unknown"
}

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  /** For public API endpoints: 100 requests per minute */
  public: { limit: 100, windowInSeconds: 60 },
  /** For authentication endpoints: 10 requests per minute */
  auth: { limit: 10, windowInSeconds: 60 },
  /** For login: 5 attempts per minute (stricter for brute force protection) */
  login: { limit: 5, windowInSeconds: 60 },
  /** For registration: 3 attempts per hour */
  register: { limit: 3, windowInSeconds: 3600 },
  /** For password reset: 3 attempts per 15 minutes */
  passwordReset: { limit: 3, windowInSeconds: 900 },
  /** For expensive operations: 20 requests per minute */
  expensive: { limit: 20, windowInSeconds: 60 },
  /** For upload endpoints: 30 requests per hour */
  upload: { limit: 30, windowInSeconds: 3600 },
} as const

/**
 * Create a rate-limited response helper
 */
export function createRateLimitedResponse(
  message: string = "Demasiadas solicitudes. Por favor, intenta más tarde."
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
