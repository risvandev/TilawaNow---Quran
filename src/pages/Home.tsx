import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Clock } from "lucide-react";
import { POPULAR_SURAHS } from "@/lib/quran-api";
import { Footer } from "@/components/layout/Footer";

const Home = () => {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{greeting}</h1>
          <p className="text-muted-foreground">Begin your Quran journey today</p>
        </div>

        {/* Continue Reading Card */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up delay-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Continue where you left off</p>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Al-Fatihah <span className="font-arabic text-accent">الفاتحة</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Ayah 1 of 7</p>
              <Button asChild variant="hero" size="default">
                <Link to="/read/1">
                  Continue Reading
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Reading */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up delay-200">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-secondary"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray="0 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">0</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Today's Reading</h3>
              <p className="text-sm text-muted-foreground">10 ayahs to go</p>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mb-8 animate-fade-in-up delay-300">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {POPULAR_SURAHS.map((surah, index) => (
              <Link
                key={surah.number}
                to={`/read/${surah.number}`}
                className="surah-card flex items-center gap-3 opacity-0 animate-fade-in"
                style={{ animationDelay: `${300 + index * 50}ms`, animationFillMode: "forwards" }}
              >
                <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {surah.number}
                </span>
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground truncate">{surah.name}</h4>
                  <p className="text-xs text-muted-foreground">{surah.verses} verses</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up delay-400">
          <h2 className="text-lg font-semibold text-foreground mb-4">Benefits of Daily Reading</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-muted-foreground text-sm">
                Reading Surah Al-Mulk before sleeping provides protection from the torment of the grave.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-muted-foreground text-sm">
                Surah Al-Kahf, read every Friday, brings light between two Fridays.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <p className="text-muted-foreground text-sm">
                Surah Ya-Sin is the heart of the Quran and brings countless blessings.
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="ayah-highlight rounded-xl animate-fade-in-up delay-500">
          <p className="quran-verse text-accent mb-4">
            وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
          </p>
          <p className="text-muted-foreground italic mb-2">
            "And recite the Quran with measured recitation."
          </p>
          <p className="text-sm text-muted-foreground">— Surah Al-Muzzammil (73:4)</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
