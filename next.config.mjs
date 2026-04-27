/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "verses.quran.com",
      },
      {
        protocol: "https",
        hostname: "api.quran.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      }
    ],
  },
  typescript: {
    // Re-enabled for production readiness
    ignoreBuildErrors: false, 
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              "script-src 'self' 'unsafe-inline' https://js.puter.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://verses.quran.com https://api.quran.com https://raw.githubusercontent.com https://lh3.googleusercontent.com https://*.supabase.co",
              "connect-src 'self' https://api.quran.com https://*.supabase.co wss://*.supabase.co https://*.puter.com https://*.puter.io https://api.puter.com",
              "font-src 'self' data:",
              "frame-ancestors 'self'",
              "media-src 'self' https://verses.quran.com https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
