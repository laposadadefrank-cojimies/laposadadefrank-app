import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Si no hay sesión y trata de entrar a admin, redirigir a login
  if (!session && (req.nextUrl.pathname.startsWith('/calendar') || req.nextUrl.pathname.startsWith('/rooms'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/calendar/:path*', '/rooms/:path*'],
}
