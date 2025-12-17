import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Target,
  Flame,
  Calendar,
  ChevronRight,
  TrendingUp,
  Award,
} from "lucide-react";
import { QURAN_STATS, POPULAR_SURAHS } from "@/lib/quran-api";

const Dashboard = () => {
  // Mock data - in production, this would come from user's saved progress
  const stats = {
    totalAyahsRead: 156,
    totalSurahsStarted: 5,
    currentStreak: 3,
    longestStreak: 7,
    todayProgress: 30,
    weeklyGoal: 70,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your Quran reading journey</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Ayahs Read</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalAyahsRead}</p>
            <p className="text-xs text-muted-foreground">
              {((stats.totalAyahsRead / QURAN_STATS.totalAyahs) * 100).toFixed(1)}% of Quran
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Surahs Started</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalSurahsStarted}</p>
            <p className="text-xs text-muted-foreground">of {QURAN_STATS.totalSurahs} total</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.currentStreak} days</p>
            <p className="text-xs text-muted-foreground">
              Best: {stats.longestStreak} days
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Weekly Goal</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.weeklyGoal}%</p>
            <Progress value={stats.weeklyGoal} className="h-2 mt-2" />
          </div>
        </div>

        {/* Today's Progress */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Today's Progress</h2>
            <span className="text-sm text-muted-foreground">{stats.todayProgress}% complete</span>
          </div>
          <Progress value={stats.todayProgress} className="h-3 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            You've read 3 of 10 ayahs today. Keep going!
          </p>
          <Button asChild variant="hero">
            <Link to="/read">
              Continue Reading
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { surah: "Al-Fatihah", ayahs: "1-7", date: "Today" },
              { surah: "Al-Baqarah", ayahs: "1-25", date: "Yesterday" },
              { surah: "Al-Kahf", ayahs: "1-10", date: "2 days ago" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.surah}</p>
                  <p className="text-sm text-muted-foreground">Ayahs {activity.ayahs}</p>
                </div>
                <span className="text-sm text-muted-foreground">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: "First Surah", unlocked: true },
              { icon: Flame, label: "3 Day Streak", unlocked: true },
              { icon: Target, label: "100 Ayahs", unlocked: true },
              { icon: Award, label: "Complete Juz", unlocked: false },
            ].map((achievement, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-xl ${
                  achievement.unlocked ? "bg-primary/10" : "bg-secondary/50 opacity-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    achievement.unlocked ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <achievement.icon
                    className={`w-6 h-6 ${
                      achievement.unlocked ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <p className="text-sm font-medium text-foreground">{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
