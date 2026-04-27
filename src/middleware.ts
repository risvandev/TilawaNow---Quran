import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Generate a unique nonce for this request
  // Note: Standard randomUUID is used. In crypto environments, you might use more bytes.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // 2. Define the Content Security Policy
  const cspHeader = [
    "default-src 'none'",
    // Use 'nonce-${nonce}' to allow scripts with the correct nonce
    // 'strict-dynamic' allows these scripts to load their dependencies
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.puter.com`,
    // Allow styles with the nonce (required for Radix, Framer Motion, etc.)
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`, // Keeping unsafe-inline as backup for Tailwind
    `img-src 'self' blob: data: https://verses.quran.com https://api.quran.com https://raw.githubusercontent.com https://lh3.googleusercontent.com https://*.supabase.co`,
    `connect-src 'self' https://api.quran.com https://*.supabase.co wss://*.supabase.co https://*.puter.com https://*.puter.io https://api.puter.com`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "media-src 'self' https://verses.quran.com https://*.supabase.co",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  
  // Set the x-nonce header so we can access it in our components if needed
  requestHeaders.set('x-nonce', nonce)
  
  // Set the CSP header for the request (Next.js internals)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set the CSP header for the browser response
  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

// Ensure the middleware runs on all page routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
