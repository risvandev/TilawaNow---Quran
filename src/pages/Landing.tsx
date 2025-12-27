import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { QuickStartSection } from "@/components/landing/QuickStartSection";
import { HighlightedAyahSection } from "@/components/landing/HighlightedAyahSection";
import { CTASection } from "@/components/landing/CTASection";
import { AppDownloadSection } from "@/components/landing/AppDownloadSection";
import { Footer } from "@/components/layout/Footer";

const Landing = () => {
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
