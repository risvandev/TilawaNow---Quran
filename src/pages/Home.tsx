import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, User, Target, Settings, Play, Pause, Loader2, RotateCcw } from "lucide-react";
import { POPULAR_SURAHS } from "@/lib/quran-api";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { InviteDialog } from "@/components/InviteDialog";

import { useBookmarks } from "@/contexts/BookmarksContext";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { GoalSettingDialog } from "@/components/GoalSettingDialog";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userStats, dailyActivity } = useBookmarks();
  const { isKhatmahActive, currentProgress, isLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const [greeting, setGreeting] = useState("Good morning");

  // Calculate Today's Progress
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = dailyActivity.find(d => d.date === todayStr);
  const ayahsToday = todayActivity ? todayActivity.count : 0;
  const dailyGoal = userStats.dailyGoal || 10;
  const todayProgress = Math.min(Math.round((ayahsToday / dailyGoal) * 100), 100);
  const remaining = Math.max(dailyGoal - ayahsToday, 0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="w-full md:w-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{greeting}</h1>
                <p className="text-muted-foreground">Begin your Quran journey today</p>
              </div>
              {/* Settings Icon - Mobile Only */}
              <Link to="/settings" className="md:hidden shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center border border-border/50 transition-colors">
                  <Settings className="w-5 h-5 text-foreground" />
                </div>
              </Link>
            </div>
          </div>
          {user ? (
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <InviteDialog />
              <Button asChild variant="outline" size="sm" className="gap-2 shrink-0 h-8 px-2 md:h-10 md:px-4 text-xs md:text-sm">
                <Link to="/settings">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {user.user_metadata.full_name || "Profile"}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full md:w-auto">
              <InviteDialog />
              <Button asChild variant="hero" size="sm" className="flex-1 md:flex-none">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Khatmah Widget */}
        <div className="glass-card p-4 md:p-6 mb-8 animate-fade-in-up delay-100 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Khatmah (Continuous Recitation)
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentProgress ? `Resume from Surah ${currentProgress.surah_id}` : "Start your journey from beginning to end"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Restart Button - Only if progress exists */}
              {currentProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10"
                  onClick={async () => {
                    if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                      await restartKhatmah();
                    }
                  }}
                  disabled={isLoading}
                  title="Restart Khatmah"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant={isKhatmahActive ? "destructive" : "default"}
                onClick={async () => {
                  if (isKhatmahActive) {
                    stopKhatmah();
                  } else {
                    await startKhatmah();
                    // Redirect to reading page
                    const targetSurah = currentProgress?.surah_id || 1;
                    navigate(`/read/${targetSurah}`);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isKhatmahActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" /> {currentProgress ? "Resume Khatmah" : "Start Khatmah"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Continue Reading Card */}
        <div className="glass-card p-4 md:p-6 mb-8 animate-fade-in-up delay-100">
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
        <div className="glass-card p-4 md:p-6 mb-8 animate-fade-in-up delay-200 relative overflow-hidden group">
          {!user && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md transition-all">
              <p className="text-sm font-medium mb-3 text-foreground/80">Login to track daily progress</p>
              <Button asChild variant="hero" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}

          <div className={!user ? "blur-[2px] opacity-50 pointer-events-none select-none" : ""}>
            <div className="flex items-center justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                  <svg className="w-14 h-14 md:w-16 md:h-16 -rotate-90" viewBox="0 0 36 36">
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
                      strokeDasharray={`${todayProgress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base md:text-lg font-bold text-foreground">{ayahsToday}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">/ {dailyGoal}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">Today's Reading</h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{remaining > 0 ? `${remaining} ayahs to go` : "Goal achieved!"}</p>
                </div>
              </div>
              {user && (
                <GoalSettingDialog
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2 h-8 px-2 md:h-9 md:px-4 shrink-0">
                      <Target className="w-4 h-4" />
                      <span className="hidden md:inline">Set Goals</span>
                      <span className="md:hidden">Goal</span>
                    </Button>
                  }
                />
              )}
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
        <div className="glass-card p-4 md:p-6 mb-8 animate-fade-in-up delay-400">
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
          <p className="font-arabic text-lg md:text-3xl lg:text-4xl leading-loose md:leading-[3] text-accent mb-4">
            إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
          </p>
          <p className="text-muted-foreground italic mb-2">
            "Indeed, this Quran guides to that which is most suitable."
          </p>
          <p className="text-sm text-muted-foreground">— Surah Al-Isra (17:9)</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
