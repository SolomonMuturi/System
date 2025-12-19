export { default } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/auth';
import { getToken } from 'next-auth/jwt';

// Export the NextAuth middleware with custom config
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - login page
     * - api/auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Optional: Custom middleware for additional functionality
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. CORS headers for API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
    
    return response;
  }
  
  // 2. Get session token for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // 3. Protect admin routes (like user-roles)
  const adminRoutes = ['/admin', '/user-roles'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  if (isAdminRoute && token) {
    // Check if user has admin role (you'll need to implement this)
    // For now, allow access to any authenticated user
    // TODO: Add role-based access control
    const userHasAccess = true; // Replace with actual role check
    
    if (!userHasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // 4. Let NextAuth handle the authentication
  return NextResponse.next();
}