"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { QuickStartSection } from "@/components/landing/QuickStartSection";
import { HighlightedAyahSection } from "@/components/landing/HighlightedAyahSection";
import { CTASection } from "@/components/landing/CTASection";
import { AppDownloadSection } from "@/components/landing/AppDownloadSection";
import { Footer } from "@/components/layout/Footer";

const Landing = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }
  }, [user, loading, router]);

  // Prevent flash of landing page for logged in users
  if (user && !loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <QuickStartSection />
      <HighlightedAyahSection />
      <CTASection />
      <AppDownloadSection />
      <Footer />
    </div>
  );
};

export default Landing;
