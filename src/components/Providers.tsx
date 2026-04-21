"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { KhatmahProvider } from "@/contexts/KhatmahContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { ReadingTrackerProvider } from "@/contexts/ReadingTrackerContext";
import { SidebarProvider } from "@/components/layout/AppSidebar";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import { GlobalPrefetch } from "@/components/GlobalPrefetch";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PWAProvider } from "@/contexts/PWAContext";
import { AICompanionProvider } from "@/contexts/AICompanionContext";
import { useEffect, useState } from "react";
import { ReactLenis } from 'lenis/react';
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const savedFont = localStorage.getItem("quranFont");
    if (savedFont) {
      document.documentElement.style.setProperty("--font-quran", savedFont);
    }
    const savedNightMode = localStorage.getItem("nightMode") === "true";
    if (savedNightMode) {
      document.body.classList.add("night-mode");
    }
  }, []);

  return (
    <ReactLenis root>
      <NextTopLoader 
        color="hsl(var(--primary))"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
      />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PWAProvider>
            <TooltipProvider>
              <AuthProvider>
                <BookmarksProvider>
                  <ReadingTrackerProvider>
                    <AICompanionProvider>
                      <AudioPlayerProvider>
                        <KhatmahProvider>
                          <SidebarProvider>
                            <div className="relative flex flex-col min-h-screen">
                              {children}
                            </div>
                          </SidebarProvider>
                          <GlobalAudioPlayer />
                          <GlobalPrefetch />
                        </KhatmahProvider>

                      </AudioPlayerProvider>
                    </AICompanionProvider>
                  </ReadingTrackerProvider>
                </BookmarksProvider>
              </AuthProvider>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </PWAProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReactLenis>
  );
}
