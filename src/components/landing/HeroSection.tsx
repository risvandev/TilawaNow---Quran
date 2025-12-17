import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="relative container mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border mb-8 animate-fade-in-down">
          <Star className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Your Daily Companion</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-fade-in-up">
          Experience the Quran
        </h1>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary mb-8 animate-fade-in-up delay-100">
          Like Never Before
        </h2>

        {/* Bismillah */}
        <p className="quran-verse-large text-accent mb-6 animate-fade-in delay-200">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in delay-300 text-balance">
          A calm, beautiful space to read, listen, understand, and build a meaningful
          relationship with the Holy Quran. Designed with reverence and care.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-400">
          <Button asChild variant="hero" size="lg">
            <Link to="/read">
              Begin Your Journey
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="heroOutline" size="lg">
            <Link to="/read">Explore Surahs</Link>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};
