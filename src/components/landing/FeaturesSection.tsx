import {
  Headphones,
  Languages,
  Search,
  BookMarked,
  Sparkles,
  Clock,
} from "lucide-react";

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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform designed to help you connect deeply with the Holy Quran.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
