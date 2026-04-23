import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/Providers";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tilawanow.vercel.app"),
  title: "TilawaNow",
  description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
  icons: {
    icon: "/icon for app.png",
    apple: "/icon for app.png",
  },
  openGraph: {
    title: "TilawaNow",
    description: "A modern Quran platform to read, listen, and understand the Quran with clarity and ease.",
    url: "https://tilawanow.vercel.app",
    siteName: "TilawaNow",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TilawaNow",
    description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://verses.quran.com" />
        <link rel="preconnect" href="https://api.quran.com" />
        <link rel="dns-prefetch" href="https://verses.quran.com" />
        <link rel="dns-prefetch" href="https://api.quran.com" />
        <link rel="preload" as="image" href="/hero_section.webp" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
