import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-4 md:px-6 md:py-6 container mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-5 h-5 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center p-1 md:p-1.5 backdrop-blur-sm">
            <img src="/quran-logo.svg" alt="Tadabbur Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm md:text-xl text-foreground">Tadabbur</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Button asChild variant="ghost" className="text-foreground hover:bg-secondary/50 gap-2 h-8 px-2 md:h-10 md:px-4">
              <Link to="/settings">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-base">{user.user_metadata.full_name || "Profile"}</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground h-8 md:h-10 px-2 md:px-4 text-xs md:text-base">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="h-8 md:h-9 text-xs md:text-sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <div className="relative container mx-auto px-6 mt-20 mb-16 md:mt-24 md:mb-24 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full bg-secondary/80 border border-border mb-8 animate-fade-in-down">
          <Star className="w-3 h-3 md:w-4 md:h-4 text-primary" />
          <span className="text-xs md:text-sm text-muted-foreground">Your Daily Companion</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-fade-in-up">
          Experience the Quran
        </h1>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary mb-8 animate-fade-in-up delay-100">
          Like Never Before
        </h2>

        {/* Bismillah */}
        <p className="font-arabic text-3xl md:text-5xl lg:text-6xl leading-relaxed md:leading-[1.8] text-accent mb-6 animate-fade-in delay-200">
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

    </section>
  );
};
