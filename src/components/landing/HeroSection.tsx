import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

export const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero_section.png" 
          alt="Quran Background" 
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90" />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-4 md:px-6 md:py-6 container mx-auto">
        <Link href="/">
          <Logo
            className="gap-3"
            iconClassName="w-8 h-8 md:w-12 md:h-12 p-1 md:p-1.5"
            textClassName="font-bold text-lg md:text-2xl text-foreground"
            arabicClassName="text-xl md:text-3xl"
          />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Button asChild variant="ghost" className="text-foreground hover:bg-secondary/50 gap-2 h-8 px-2 md:h-10 md:px-4">
              <Link href="/settings">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-base">{user.user_metadata.full_name || "Profile"}</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground h-8 md:h-10 px-2 md:px-4 text-xs md:text-base">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="h-8 md:h-9 text-xs md:text-sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      <div className="relative container mx-auto px-6 py-12 md:py-16 text-center flex flex-col items-center justify-center">
        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground mb-12 md:mb-20 animate-fade-in-up max-w-4xl mx-auto leading-[1.1]">
          Read the Quran, Clearly
        </h1>

        {/* Bismillah */}
        <div className="mb-10 md:mb-14 animate-fade-in delay-200">
          <p className="font-arabic text-3xl md:text-5xl text-primary/90 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] select-none">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 md:mb-16 animate-fade-in delay-300 leading-relaxed font-light tracking-wide">
          Designed for clarity, focus, and reflection.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 animate-fade-in-up delay-400">
          <Button asChild variant="hero" size="lg" className="px-8 md:px-10 h-12 md:h-14 text-sm md:text-base font-semibold transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]">
            <Link href="/read" className="flex items-center">
              Begin Your Journey
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="heroOutline" size="lg" className="px-8 md:px-10 h-12 md:h-14 text-sm md:text-base font-medium border-border/50 hover:bg-secondary/50 transition-all">
            <Link href="/home">Explore Sanctuary</Link>
          </Button>
        </div>
      </div>

    </section>
  );
};
