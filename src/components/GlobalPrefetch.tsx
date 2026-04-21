"use client";

import { useEffect } from "react";
import { usePrefetch } from "@/hooks/use-prefetch";
import { useSurahs } from "@/hooks/use-quran-queries";
import { POPULAR_SURAHS } from "@/lib/quran-api";

/**
 * GlobalPrefetch handles background loading of critical data and routes
 * to ensure a snappy user experience during navigation.
 */
export function GlobalPrefetch() {
  const { prefetchRoute, prefetchSurahData } = usePrefetch();
  const { data: surahs } = useSurahs(); // This triggers the surah list fetch

  useEffect(() => {
    // 1. Prefetch core routes for instant navigation
    const coreRoutes = ["/home", "/read", "/dashboard", "/ai", "/settings"];
    coreRoutes.forEach(route => prefetchRoute(route));

    // 2. Prefetch data for the most popular Surahs
    // We do this after a small delay to prioritize the current page's resources
    const timer = setTimeout(() => {
      // Get settings from localStorage safely
      const translationId = parseInt(typeof window !== "undefined" ? localStorage.getItem("quranTranslation") || "131" : "131");
      const script = typeof window !== "undefined" ? localStorage.getItem("quranScript") || "text_uthmani" : "text_uthmani";

      // Prefetch top 3 popular surahs first
      POPULAR_SURAHS.slice(0, 3).forEach(surah => {
        prefetchSurahData(surah.number, translationId, script);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [prefetchRoute, prefetchSurahData]);

  // This component doesn't render anything
  return null;
}
