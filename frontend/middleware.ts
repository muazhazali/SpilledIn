import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check if environment variables are available (for demo mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let session = null

  // Only check Supabase session if environment variables are available
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession()
    
    session = supabaseSession
  }

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/confessions', '/toxic-wrapped']
  const authRoutes = ['/login', '/signup', '/register']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // For protected routes, only redirect if we're sure there's no session
  // This allows demo sessions (stored in localStorage) to be handled client-side
  if (isProtectedRoute && !session) {
    // Don't redirect immediately - let client-side auth handle demo sessions
    // Only redirect if this is clearly not a demo session attempt
    const userAgent = req.headers.get('user-agent') || ''
    const isBot = /bot|crawler|spider/i.test(userAgent)
    
    // Only redirect bots or if we're certain there's no auth
    if (isBot) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // For regular users, let the client-side handle it
    // The useAuth hook will redirect if needed
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // For root path, let client-side handle the routing
  // This allows demo sessions to work properly
  if (req.nextUrl.pathname === '/') {
    // Don't redirect server-side, let client-side auth handle it
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 