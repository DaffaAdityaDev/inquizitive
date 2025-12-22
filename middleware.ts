import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip gate check for these paths
  const publicPaths = ['/gate', '/api/gate']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Check if site password protection is enabled
  const sitePassword = process.env.SITE_PASSWORD
  
  if (sitePassword && !isPublicPath) {
    // Check for access cookie
    const accessCookie = request.cookies.get('site-access')
    
    if (!accessCookie || accessCookie.value !== 'granted') {
      // Redirect to gate page
      return NextResponse.redirect(new URL('/gate', request.url))
    }
  }
  
  // Continue with Supabase session handling
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
