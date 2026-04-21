import {
  Headphones,
  Languages,
  Search,
  BookMarked,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";
import Link from "next/link";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BookMarked,
    title: "Complete Quran",
    description: "Access all 114 surahs with beautiful Arabic typography and multiple translations.",
  },
  {
    icon: Headphones,
    title: "Audio Recitation",
    description: "Listen to professional reciters with verse-by-verse audio playback.",
  },
  {
    icon: Languages,
    title: "Multiple Languages",
    description: "Understand the meaning with translations in various languages.",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any verse or topic quickly with our powerful search feature.",
  },
  {
    icon: Sparkles,
    title: "AI Assistance",
    description: "Get help understanding verses with our intelligent AI assistant.",
  },
  {
    icon: Clock,
    title: "Progress Tracking",
    description: "Track your reading progress and build a consistent daily habit.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-background">
      <div className="container relative z-10 mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed to help you connect deeply with the Holy Quran.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <BorderGlow
              key={feature.title}
              className="opacity-0 animate-fade-in-up group h-full"
              style={{ 
                animationDelay: `${index * 100}ms`, 
                animationFillMode: "forwards"
              }}
              backgroundColor="hsl(var(--card))"
              glowColor="210 35 55"
              borderRadius={16}
              glowRadius={30}
              edgeSensitivity={30}
              colors={['#5c8fcc', '#7ab8ad', '#5c8fcc']}
            >
              <div className="p-6 h-full flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
};
