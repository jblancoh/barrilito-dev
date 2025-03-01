import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    if (request.nextUrl.pathname === '/maintenance') {
      return NextResponse.next()
    } 
    return NextResponse.redirect(new URL('/maintenance', request.url))
  } else {
    if (request.nextUrl.pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',]
}