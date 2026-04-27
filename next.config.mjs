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
              "script-src 'self' https://js.puter.com 'sha256-eMuh8xiwcX72rRYNAGENurQBAcH7kLlAUQcoOri3BIo=' 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-ETrgFaZYUbclXp+RIusyBBbH3iq8tpLPb+vSRLlhHJU=' 'sha256-QA56iIyapxf5W9uIM6WkgKrCQzOe4G4v2PloJ0wFzBg=' 'sha256-q/IwJf6mKge10mhZ6gYiCzJeUNBvM2QT8MQKuQISQhc=' 'sha256-lxIb09i92dLGsde3NpBFeo41QHrRDQjuAGobv7OIdPo=' 'sha256-P1WcItQJqorVtHPl5zXOf44dcpPfVA86U1CB5G8E2do=' 'sha256-sWOuLY0rkAoFUUAhx7Fyke+H4LFeVpSQJSeaRvhDyqI=' 'sha256-bGqhlR9C1FbRg9THxbOlKCsufWYXUSTG22R446Hkvkc=' 'sha256-OOdk0BODqbGPofJBL23s8pk+0daOfhEhmGJIb9WFURw=' 'sha256-ysxOalbh6BMqomOPgUc7X19Avc4w7XEg953MQkkFpq4='",
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
