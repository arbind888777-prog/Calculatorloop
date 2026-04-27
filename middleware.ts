import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { proxy } from './src/proxy'

function hasAdminPageAccess(role?: string) {
  return role === 'SUPER_ADMIN' || role === 'EDITOR' || role === 'VIEWER'
}

function hasAdminApiAccess(role?: string) {
  return role === 'SUPER_ADMIN' || role === 'EDITOR' || role === 'VIEWER'
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Not authenticated → redirect to admin login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated but not an admin role → redirect to home
    const role = token.role as string | undefined
    const hasAccess = hasAdminPageAccess(role)
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect /api/admin routes (seed is handled by its own route guard)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/seed')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = token.role as string | undefined
    const hasAccess = hasAdminApiAccess(role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Fall through to existing proxy logic for all other routes
  const response = await proxy(request)

  // Forward the current pathname so server components (like admin layout)
  // can determine which page is being rendered
  const res = response ?? NextResponse.next()
  res.headers.set('x-next-pathname', pathname)
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/auth (NextAuth routes — must NEVER be intercepted by middleware)
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
