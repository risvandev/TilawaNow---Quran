import { BookOpen, Users, Layers, Infinity } from "lucide-react";
import { QURAN_STATS } from "@/lib/quran-api";

const stats = [
  {
    icon: BookOpen,
    value: QURAN_STATS.totalAyahs.toLocaleString(),
    label: "Total Ayahs",
    description: "Verses of divine guidance",
  },
  {
    icon: Layers,
    value: QURAN_STATS.totalSurahs.toString(),
    label: "Total Surahs",
    description: "Chapters of wisdom",
  },
  {
    icon: Users,
    value: QURAN_STATS.totalJuz.toString(),
    label: "Total Juz",
    description: "Divisions for easy reading",
  },
  {
    icon: Infinity,
    value: "∞",
    label: "Blessings",
    description: "Infinite rewards await",
  },
];

export const StatsSection = () => {
  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-lg font-medium text-foreground mb-1">{stat.label}</div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
