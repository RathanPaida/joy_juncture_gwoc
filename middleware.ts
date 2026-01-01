import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Get user role from token
    const token = req.nextauth.token;
    
    // Protected admin routes
    if (req.nextUrl.pathname.startsWith('/blog/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      if (token.role !== 'admin' && token.role !== 'editor') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // For admin routes, we'll handle in the function
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/blog/admin/:path*',
    '/api/admin/:path*',
  ],
};