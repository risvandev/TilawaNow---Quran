import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/index.css";
import { Providers } from "@/components/Providers";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tilawanow.vercel.app"),
  title: "TilawaNow — Read, Listen, Understand",
  description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "TilawaNow — Read, Listen, Understand",
    description: "A modern Quran platform to read, listen, and understand the Quran with clarity and ease.",
    url: "https://tilawanow.vercel.app",
    siteName: "TilawaNow",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TilawaNow — Read, Listen, Understand",
    description: "Read, listen, and reflect on the Holy Quran through a modern and respectful digital experience.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
