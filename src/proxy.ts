import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { toolsData } from '@/lib/toolsData'

const SUPPORTED_LANGS = new Set([
  'en',
  'hi',
  'ta',
  'te',
  'bn',
  'mr',
  'gu',
  // International
  'es',
  'pt',
  'fr',
  'de',
  'id',
  'ar',
  'ur',
  'ja',
])

/**
 * Legacy category name mappings: old URL path names to new category IDs
 * Used for redirecting old /{legacy-category}/{calculator}.html URLs
 */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'business-tools': 'business',
  'construction-tools': 'construction',
  'datetime-tools': 'datetime',
  'date-time-tools': 'datetime',
  'date-time': 'datetime',
  'education-tools': 'education',
  'everyday-tools': 'everyday',
  'financial-calculators': 'financial',
  'financial': 'financial',
  'finance': 'financial',
  'fitness-health': 'health',
  'health-tools': 'health',
  'health-fitness': 'health',
  'math-tools': 'math',
  'math': 'math',
  'physics-tools': 'physics',
  'physics': 'physics',
  'scientific-tools': 'scientific',
  'scientific': 'scientific',
  'technology-tools': 'technology',
  'technology': 'technology',
  'travel-tools': 'travel',
  'travel': 'travel',
}

function getLocaleFromPath(pathname: string): string | null {
  const parts = pathname.split('/')
  const maybe = parts[1]
  if (maybe && SUPPORTED_LANGS.has(maybe)) return maybe
  return null
}

function stripLocaleFromPath(pathname: string, locale: string): string {
  const prefix = `/${locale}`
  if (!pathname.startsWith(prefix)) return pathname
  const stripped = pathname.slice(prefix.length)
  return stripped.length ? stripped : '/'
}

function normalizeLegacyCalculatorId(raw: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(raw ?? ''))
    } catch {
      return String(raw ?? '')
    }
  })()

  const slug = decoded.trim().toLowerCase()
  const noExt = slug.replace(/\.(html?|php)$/i, '')
  const normalized = noExt.replace(/_/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-')
  return normalized
}

function getLastPathSegment(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

function findCategoryForCalculator(id: string): string | null {
  for (const [categoryId, category] of Object.entries(toolsData)) {
    for (const sub of Object.values(category.subcategories ?? {})) {
      const tool = (sub as any).calculators.find((c: any) => c.id === id)
      if (tool) return categoryId
    }
  }
  return null
}

/**
 * Global proxy for legacy redirects, locale routing, and security headers.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  try {

  // Never interfere with NextAuth's JSON endpoints.
  // These routes must return raw auth responses, not locale rewrites or custom request headers.
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Legacy URL redirects (SEO): handle old .html/.php calculator pages indexed by Google.
  // Supports locale-prefixed URLs too (e.g. /hi/financial-calculators/sip-calculator.html).
  if (!pathname.startsWith('/api')) {
    const pathLocale = getLocaleFromPath(pathname)
    const prefix = pathLocale ? `/${pathLocale}` : ''
    const basePath = pathLocale ? stripLocaleFromPath(pathname, pathLocale) : pathname

    const lowerBasePath = basePath.toLowerCase()

    // /index.html -> /
    if (/^\/index\.(html?|php)$/i.test(basePath)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `${prefix}/`
      redirectUrl.search = search
      return NextResponse.redirect(redirectUrl, 308)
    }

    // ===== LEGACY CATEGORY-BASED .HTML URLs =====
    // Handle: /business-tools/roi-calculator.html, /financial-calculators/sip-calculator.html
    // Pattern: /{legacy-category}/{calculator-slug}.html
    const legacyCategoryMatch = basePath.match(/^\/([a-z\-]+)\/([a-z\-0-9]+)\.(html?|php)$/i)
    if (legacyCategoryMatch) {
      const [, legacyCategoryName, calculatorSlug] = legacyCategoryMatch
      const calculatorId = normalizeLegacyCalculatorId(calculatorSlug)
      
      // Try to map legacy category name to new category
      const mappedCategory = LEGACY_CATEGORY_MAP[legacyCategoryName.toLowerCase()]
      
      // First, try to find the calculator to get its actual category
      const actualCategory = findCategoryForCalculator(calculatorId)
      const targetPrefix = pathLocale ? `/${pathLocale}` : '/en'
      
      if (actualCategory) {
        // Found the calculator - redirect to canonical URL
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `${targetPrefix}/${actualCategory}/${calculatorId}`
        redirectUrl.search = search
        return NextResponse.redirect(redirectUrl, 301)
      } else if (mappedCategory) {
        // Calculator not found by ID, but legacy category maps to a known category
        // Redirect to mapped category (will show 404 if calculator doesn't exist there)
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `${targetPrefix}/${mappedCategory}/${calculatorId}`
        redirectUrl.search = search
        return NextResponse.redirect(redirectUrl, 301)
      }
    }

    // Redirect ALL /calculator/... URLs to canonical /{lang}/{category}/{calculator}
    if (basePath.startsWith('/calculator/')) {
      const slug = basePath.replace('/calculator/', '')
      const cleanId = slug.toLowerCase().replace(/\.html?$/i, '')
      const id = normalizeLegacyCalculatorId(cleanId)
      const categoryId = findCategoryForCalculator(id)
      const targetPrefix = pathLocale ? `/${pathLocale}` : '/en'
      
      const redirectUrl = request.nextUrl.clone()
      if (categoryId) {
        redirectUrl.pathname = `${targetPrefix}/${categoryId}/${id}`
      } else {
        // If calculator not found, return 404 instead of keeping legacy route
        return NextResponse.json(
          { error: 'Calculator not found' },
          { status: 404 }
        )
      }
      redirectUrl.search = search
      return NextResponse.redirect(redirectUrl, 301)
    }

    // Case-insensitive category URLs: /category/Financial -> /category/financial
    if (basePath.startsWith('/category/')) {
      const slug = basePath.replace('/category/', '')
      const lowercaseSlug = slug.toLowerCase()
      
      if (slug !== lowercaseSlug) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `${prefix}/category/${lowercaseSlug}`
        redirectUrl.search = search
        return NextResponse.redirect(redirectUrl, 301)
      }
    }

    // Remove trailing slashes except for root
    if (basePath !== '/' && basePath.endsWith('/')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `${prefix}${basePath.slice(0, -1)}`
      redirectUrl.search = search
      return NextResponse.redirect(redirectUrl, 301)
    }

    // Any legacy extension: map to canonical calculator route, preferring category route when known.
    if (/\.(html?|php)$/i.test(lowerBasePath)) {
      const last = getLastPathSegment(basePath)
      const id = normalizeLegacyCalculatorId(last)
      if (id) {
        const categoryId = findCategoryForCalculator(id)
        const targetPrefix = pathLocale ? `/${pathLocale}` : '/en'
        const redirectUrl = request.nextUrl.clone()
        if (categoryId) {
          redirectUrl.pathname = `${targetPrefix}/${categoryId}/${id}`
        } else {
          redirectUrl.pathname = `${targetPrefix}/calculator/${id}`
        }
        redirectUrl.search = search
        return NextResponse.redirect(redirectUrl, 308)
      }
    }

    // Legacy folder patterns without extension (common in old sites): /financial-calculators/<id>
    // Map to new hierarchy when category is known.
    const baseParts = basePath.split('/').filter(Boolean)
    if (baseParts.length === 2 && baseParts[0].includes('calculators')) {
      const id = normalizeLegacyCalculatorId(baseParts[1])
      if (id) {
        const categoryId = findCategoryForCalculator(id)
        const targetPrefix = pathLocale ? `/${pathLocale}` : '/en'
        const redirectUrl = request.nextUrl.clone()
        if (categoryId) {
          redirectUrl.pathname = `${targetPrefix}/${categoryId}/${id}`
        } else {
          redirectUrl.pathname = `${targetPrefix}/calculator/${id}`
        }
        redirectUrl.search = search
        return NextResponse.redirect(redirectUrl, 308)
      }
    }

    // Fallback: /{category}/{calc} without locale prefix — rewrite to /calculator/{calc}
    // This handles direct navigation to category-style URLs (e.g., from language switching).
    if (baseParts.length === 2 && !pathLocale && (toolsData as any)[baseParts[0]]) {
      const calcId = normalizeLegacyCalculatorId(baseParts[1])
      if (calcId) {
        const rewriteUrl = request.nextUrl.clone()
        rewriteUrl.pathname = `/calculator/${calcId}`
        return NextResponse.rewrite(rewriteUrl)
      }
    }
  }

  // Locale routing (skip API routes)
  if (!pathname.startsWith('/api')) {
    const pathLocale = getLocaleFromPath(pathname)

    // If URL contains a locale prefix, rewrite to the underlying route and persist the locale.
    if (pathLocale) {
      const rewrittenPath = stripLocaleFromPath(pathname, pathLocale)
      const rewriteUrl = request.nextUrl.clone()

      // If the locale-prefixed path follows the new structure /{lang}/{category}/{calculator},
      // rewrite it to the existing canonical calculator route so server rendering uses id param.
      const parts = rewrittenPath.split('/').filter(Boolean)
      if (parts.length >= 2) {
        const possibleCategory = parts[0]
        const possibleId = parts[1]
        // If this looks like category+calculator, rewrite to /calculator/:id
        if ((toolsData as any)[possibleCategory]) {
          const normalizedId = normalizeLegacyCalculatorId(possibleId)
          rewriteUrl.pathname = `/calculator/${normalizedId}`
        } else {
          rewriteUrl.pathname = rewrittenPath
        }
      } else {
        rewriteUrl.pathname = rewrittenPath
      }
      // Pass locale to the downstream render so server components can read it on the same request.
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-calculator-language', pathLocale)
      // Preserve the original pathname (including locale prefix) for canonical/hreflang.
      requestHeaders.set('x-original-pathname', pathname)
      let response: NextResponse
      try {
        response = NextResponse.rewrite(rewriteUrl, {
          request: {
            headers: requestHeaders,
          },
        })
      } catch {
        // Some Edge runtimes can be strict about request header overrides.
        // Fall back to a plain rewrite so we don't 500 the entire site.
        response = NextResponse.rewrite(rewriteUrl)
      }
      response.cookies.set('calculator-language', pathLocale, { path: '/', sameSite: 'lax' })

      // Security Headers
      response.headers.set(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://www.google-analytics.com https://www.clarity.ms https://api.resend.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
      )
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')

      if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      }

      if (request.nextUrl.pathname.startsWith('/api/v1')) {
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        response.headers.set('Access-Control-Max-Age', '86400')
      }

      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: response.headers,
        })
      }

      return response
    }

    // If URL has no locale prefix, redirect to the saved locale to keep the locale in the URL.
    const savedLocale = request.cookies.get('calculator-language')?.value
    if (savedLocale && SUPPORTED_LANGS.has(savedLocale) && savedLocale !== 'en') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `/${savedLocale}${pathname}`
      // search is preserved by clone, but keep this explicit to avoid regressions
      redirectUrl.search = search
      return NextResponse.redirect(redirectUrl)
    }
  }

  // For non-locale paths, still pass the original pathname to downstream rendering.
  // (Useful for canonical/hreflang; does not change routing.)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-original-pathname', pathname)
  let response: NextResponse
  try {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch {
    // Same as above: avoid hard-failing if the runtime rejects request header overrides.
    response = NextResponse.next()
  }

  // Security Headers
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://www.google-analytics.com https://www.clarity.ms https://api.resend.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    })
  }

  // Validate new canonical URL structure for locale-prefixed routes and block random/invalid paths.
  try {
    const parts = request.nextUrl.pathname.split('/').filter(Boolean)
    // If first segment is a supported locale, enforce category and calculator validity.
    const first = parts[0]
    if (first && SUPPORTED_LANGS.has(first)) {
      // If path is like /{lang}/{something}
      if (parts.length >= 2) {
        const categoryCandidate = parts[1]
        const category = (toolsData as any)[categoryCandidate]
        if (!category) {
          return new NextResponse('Not Found', { status: 404 })
        }

        // If calculator slug present, ensure it belongs to this category.
        if (parts.length >= 3) {
          const calcRaw = parts[2]
          const calcId = normalizeLegacyCalculatorId(calcRaw)
          let found = false
          for (const sub of Object.values(category.subcategories ?? {})) {
            if ((sub as any).calculators.find((c: any) => c.id === calcId)) {
              found = true
              break
            }
          }
          if (!found) {
            return new NextResponse('Not Found', { status: 404 })
          }
        }
      }
    }
  } catch (e) {
    // If validation throws, don't break the site — allow request to continue.
    console.error('URL validation error in proxy middleware:', e)
  }

  return response

  } catch {
    // As a last resort, do not block the request.
    return NextResponse.next()
  }
}

/**
 * Configure which routes should use this proxy.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth routes — must never be intercepted)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
