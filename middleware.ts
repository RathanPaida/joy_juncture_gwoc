// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/', '/about', '/contact', '/blogs'];
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('firebase-auth-token');

  // If there's no token and trying to access protected routes
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const userRole = request.cookies.get('user-role');
    if (userRole?.value !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};