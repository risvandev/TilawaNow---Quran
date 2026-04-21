import { BookOpen, Users, Layers, Infinity } from "lucide-react";
import { QURAN_STATS } from "@/lib/quran-api";
import { Counter } from "@/components/ui/counter";
import BorderGlow from "@/components/ui/BorderGlow";

const stats = [
  {
    icon: BookOpen,
    value: QURAN_STATS.totalAyahs,
    isNumber: true,
    label: "Total Ayahs",
    description: "Verses of divine guidance",
  },
  {
    icon: Layers,
    value: QURAN_STATS.totalSurahs,
    isNumber: true,
    label: "Total Surahs",
    description: "Chapters of wisdom",
  },
  {
    icon: "/juz_icon-tilawanow.svg", // Custom Icon Path
    value: QURAN_STATS.totalJuz,
    isNumber: true,
    label: "Total Juz",
    description: "Divisions for easy reading",
  },
  {
    icon: Infinity,
    value: "∞",
    isNumber: false,
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
            <BorderGlow
              key={stat.label}
              className="opacity-0 animate-fade-in-up h-full"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
              backgroundColor="hsl(var(--card))"
              glowColor="210 35 55"
              borderRadius={16}
              glowRadius={30}
              edgeSensitivity={30}
              colors={['#7ab8ad', '#5c8fcc', '#818cf8']}
            >
              <div className="p-4 md:p-5 text-center h-full flex flex-col justify-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 shrink-0 transition-transform hover:scale-110 duration-300">
                  {typeof stat.icon === 'string' ? (
                    <img src={stat.icon} alt={stat.label} className="w-6 h-6 text-primary" />
                  ) : (
                    <stat.icon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.isNumber ? (
                    <Counter end={stat.value as number} />
                  ) : (
                    <span>{stat.value}</span>
                  )}
                </div>
                <div className="text-lg font-medium text-foreground mb-1">{stat.label}</div>
                <p className="hidden md:block text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
};
