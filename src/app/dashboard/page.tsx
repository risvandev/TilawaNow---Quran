"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Flame,
  Calendar,
  ChevronRight,
  Award,
  Clock,
  Settings,
  Activity,
  Play,
  Pause,
  Loader2,
  RotateCcw
} from "lucide-react";
import { QURAN_STATS } from "@/lib/quran-api";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { supabase } from "@/lib/supabase";
import { useSurahs } from "@/hooks/use-quran-queries";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useRouter();
  const { readingHistory, userStats, dailyActivity } = useBookmarks();
  const { isKhatmahActive, currentProgress, isLoading: isKhatmahLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const { data: allSurahs = [] } = useSurahs();
  const [readingProfile, setReadingProfile] = useState<{ last_read_surah: number; last_read_ayah: number } | null>(null);

  // Derived Stats
  const totalSurahsStarted = readingHistory.length;
  const totalAyahsRead = userStats.totalAyahsRead;
  const currentStreak = userStats.currentStreak;

  // Calculate Today's Progress (Count only)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = dailyActivity.find(d => d.date === todayStr);
  const ayahsToday = todayActivity ? todayActivity.count : 0;

  // Activity Data
  const getActivityData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(d => {
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      const activity = dailyActivity.find(a => a.date === dateStr);
      return { name: dayName, ayahs: activity ? activity.count : 0 };
    });
  };

  const activityData = getActivityData();

  // Recent Sessions
  const recentSessions = [...readingHistory]
    .sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime())
    .slice(0, 3)
    .map(h => {
      return {
        surah: `Surah ${h.surah_id}`,
        ayahs: h.verse_key?.split(':')[1] || "1",
        date: new Date(h.last_read_at).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        duration: "recently"
      };
    });

  const [suggestion, setSuggestion] = useState<{ type: 'unread' | 'popular', title: string, subtitle: string, link: string } | null>(null);

  useEffect(() => {
    const calculateSuggestions = async () => {
      if (!user) return;
      try {
        // Fetch RDS Profile for Resume Engine
        const { data: profile } = await supabase
          .from('user_reading_profile')
          .select('last_read_surah, last_read_ayah')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setReadingProfile({ 
            last_read_surah: profile.last_read_surah, 
            last_read_ayah: profile.last_read_ayah 
          });
        }

        const { data: popularData } = await supabase
          .from('verses_read')
          .select('verse_key, read_count')
          .eq('user_id', user.id)
          .order('read_count', { ascending: false })
          .limit(1)
          .single();

        const startedSurahIds = new Set(readingHistory.map(h => h.surah_id));
        const unreadSurah = allSurahs.find(s => !startedSurahIds.has(s.id));

        if (profile) {
          const surahName = allSurahs.find(s => s.id === profile.last_read_surah)?.name_simple || "Surah";
          setSuggestion({
            type: 'popular', // reuse style
            title: "Continue Reading",
            subtitle: `Resume from ${surahName} Ayah ${profile.last_read_ayah}`,
            link: `/read/${profile.last_read_surah}?verse=${profile.last_read_ayah}`
          });
        } else if (popularData && popularData.read_count > 1) {
          setSuggestion({
            type: 'popular',
            title: "Most Read Ayah",
            subtitle: `You've read Ayah ${popularData.verse_key} ${popularData.read_count} times`,
            link: `/read/${popularData.verse_key.split(':')[0]}?verse=${popularData.verse_key.split(':')[1]}`
          });
        } else if (unreadSurah) {
          setSuggestion({
            type: 'unread',
            title: "Try Something New",
            subtitle: `Read Surah ${unreadSurah.name_simple} (${unreadSurah.translated_name.name})`,
            link: `/read/${unreadSurah.id}`
          });
        }
      } catch (e) {
        console.error("Error calculating suggestions", e);
      }
    };
    calculateSuggestions();
  }, [user, readingHistory, allSurahs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Dashboard Access Restricted</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            The dashboard is exclusive to registered members. Join us to track your progress, save bookmarks, and view personal statistics.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10 animate-fade-in">
          <div className="w-full md:w-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
                  Welcome back,
                  <span className="block md:inline text-[#648CB4] md:ml-2">{user.user_metadata.full_name || "User"}</span>
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg">Your spiritual journey continues.</p>
              </div>

              <Link href="/settings" className="md:hidden shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center border border-border/50 transition-colors">
                  <Settings className="w-5 h-5 text-foreground" />
                </div>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-full md:w-auto">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-foreground">Current Streak</span>
              <span className="text-xs text-muted-foreground">{currentStreak} days</span>
            </div>
            <Link href="/settings" className="hidden md:block">
              <div className="w-12 h-12 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center border border-border/50 transition-colors">
                <Settings className="w-6 h-6 text-foreground" />
              </div>
            </Link>
          </div>
        </div>

        {/* Khatmah Widget */}
        {currentProgress && (
          <div className="glass-card p-4 md:p-6 mb-8 bg-gradient-to-r from-primary/5 to-transparent border-primary/20 flex flex-row items-center justify-between gap-3 md:gap-6 animate-fade-in-up delay-100">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-primary shadow-sm">
                <Target className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-xl font-bold text-foreground mb-0 md:mb-1 truncate">
                  Khatmah
                  <span className="hidden md:inline"> (Continuous Recitation)</span>
                </h3>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Resume from Surah {currentProgress.surah_id}
                </p>
                <p className="text-xs text-muted-foreground md:hidden truncate">
                  Surah {currentProgress.surah_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 md:h-10 md:w-10 shrink-0"
                onClick={async () => {
                  if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                    await restartKhatmah();
                  }
                }}
                disabled={isKhatmahLoading}
                title="Restart Khatmah"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>

              <Button
                size="lg"
                className="w-auto min-w-0 h-8 px-3 text-xs md:h-12 md:px-8 md:text-base md:min-w-[140px] shadow-lg shadow-primary/20 shrink-0"
                variant={isKhatmahActive ? "destructive" : "default"}
                onClick={async () => {
                  if (isKhatmahActive) {
                    stopKhatmah();
                  } else {
                    await startKhatmah();
                    const targetSurah = currentProgress?.surah_id || 1;
                    navigate.push(`/read/${targetSurah}`);
                  }
                }}
                disabled={isKhatmahLoading}
              >
                {isKhatmahLoading ? (
                  <Loader2 className="w-3.5 h-3.5 md:w-5 md:h-5 animate-spin" />
                ) : isKhatmahActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                    <span className="md:hidden">Stop</span>
                    <span className="hidden md:inline">Stop Khatmah</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                    <span className="md:hidden">Resume</span>
                    <span className="hidden md:inline">Resume Khatmah</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
          {[
            {
              label: "Ayahs Read Today",
              value: ayahsToday,
              sub: "Daily activity total",
              icon: BookOpen,
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
              borderColor: "border-blue-500/20"
            },
            {
              label: "Surahs Started",
              value: totalSurahsStarted,
              sub: `${QURAN_STATS.totalSurahs - totalSurahsStarted} Remaining`,
              icon: Target,
              color: "text-purple-500",
              bgColor: "bg-purple-500/10",
              borderColor: "border-purple-500/20"
            },
            {
              label: "Current Streak",
              value: currentStreak,
              sub: "Days active",
              icon: Flame,
              color: "text-orange-500",
              bgColor: "bg-orange-500/10",
              borderColor: "border-orange-500/20"
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-card p-3 md:p-6 hover-lift border border-border/50 relative overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mt-1 md:mt-2">
                <p className="text-muted-foreground font-medium text-[10px] md:text-sm mb-0.5 md:mb-1">{stat.label}</p>
                <h3 className="text-lg md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">{stat.value}</h3>
                <p className="text-[9px] md:text-xs text-muted-foreground truncate">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Reading Activity
                  </h2>
                  <p className="text-sm text-muted-foreground">Ayahs read over the last 7 days</p>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                      cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    />
                    <Bar dataKey="ayahs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-4 md:p-8 animate-fade-in-up delay-300">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Recent Sessions
              </h2>
              <div className="space-y-3 md:space-y-4">
                {recentSessions.length > 0 ? (
                  recentSessions.map((activity, index) => (
                    <div key={index} className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors border border-transparent hover:border-border/50">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-foreground truncate">{activity.surah}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Ayah {activity.ayahs}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs md:text-sm font-medium text-foreground">{activity.duration}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm">No recent activity. Start reading!</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 animate-fade-in-up delay-500">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Achievements Grid with numbers replacing icons */}
                {[
                  { icon: Calendar, label: "Active Days", value: `${userStats.totalActiveDays}`, unlocked: userStats.totalActiveDays > 0 },
                  { icon: Target, label: "Quran Read", value: `${((userStats.uniqueAyahsRead / QURAN_STATS.totalAyahs) * 100).toFixed(1)}%`, unlocked: userStats.uniqueAyahsRead > 0 },
                  { icon: BookOpen, label: "Surahs", value: `${totalSurahsStarted}`, unlocked: totalSurahsStarted > 0 },
                  { icon: Award, label: "Total Ayahs", value: `${totalAyahsRead}`, unlocked: totalAyahsRead > 0 },
                ].map((achievement, index) => (
                  <div key={index} className={`p-4 rounded-xl border flex flex-col items-center text-center justify-center gap-2 transition-all relative ${achievement.unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent opacity-50 grayscale"}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 text-sm font-bold ${achievement.unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {achievement.value}
                    </div>
                    <span className="text-sm font-bold text-foreground leading-tight">{achievement.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {suggestion && (
              <div className="glass-card p-8 animate-fade-in-up delay-600 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {suggestion.title}
                </h2>
                <p className="text-muted-foreground mb-6">{suggestion.subtitle}</p>
                <Button asChild variant="default" className="w-full">
                  <Link href={suggestion.link}>Go to {suggestion.type === 'unread' ? 'Surah' : 'Ayah'}</Link>
                </Button>
              </div>
            )}
            
            <div className="glass-card p-8 bg-primary/5 border-primary/10">
               <h3 className="font-bold text-foreground mb-2">Track Your Progress</h3>
               <p className="text-sm text-muted-foreground mb-4">You&apos;ve read {totalAyahsRead} ayahs in total across {totalSurahsStarted} surahs. Keep up the consistent habit!</p>
               <Button asChild variant="hero" className="w-full">
                  <Link href={readingProfile ? `/read/${readingProfile.last_read_surah}?verse=${readingProfile.last_read_ayah}` : "/read"}>
                    {readingProfile ? "Continue Reading" : "Start Reading"}
                  </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
