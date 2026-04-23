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
  eslint: {
    // Re-enabled for production readiness
    ignoreDuringBuilds: false, 
  }
};

export default nextConfig;
