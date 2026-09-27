import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveMaintenanceAction } from '@/lib/maintenance'

export function proxy(request: NextRequest) {
  const action = resolveMaintenanceAction(
    request.nextUrl.pathname,
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
  )

  switch (action.type) {
    case 'rewrite':
      return NextResponse.rewrite(new URL(action.destination, request.url), {
        status: action.status,
        headers: { 'Retry-After': String(action.retryAfterSeconds) },
      })
    case 'redirect':
      return NextResponse.redirect(new URL(action.destination, request.url))
    case 'next':
      return NextResponse.next()
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|assets).*)',]
}
