import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Heart,
  Globe,
  Users,
  Sparkles,
  Shield,
  Zap,
  Coffee,
  ChevronLeft
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const fromLanding = location.state?.fromLanding;

  // Show back button if user is guest OR if they came from Landing Page footer
  const showBackButton = !user || fromLanding;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        {/* Back Button - Only for Landing Page visitors (Guests or from Footer) */}
        {showBackButton && (
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About <span className="text-primary">TilawaNow</span>
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-8" />
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            TilawaNow is a modern, privacy-focused platform designed to make connecting with the Holy Quran effortless, accessible, and spiritually enriching for everyone, everywhere.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-20 animate-fade-in-up delay-100">
          <div className="glass-card p-8 hover-lift border-primary/20">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To leverage technology to bring the words of Allah closer to hearts. We aim to remove barriers to understanding by providing abundant resources, translations, and tools in a beautiful, distraction-free environment.
            </p>
          </div>
          <div className="glass-card p-8 hover-lift border-accent/20">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              A world where the Quran is easily accessible to all, regardless of language or background. We envision a community growing together in knowledge and spirituality through a platform that respects their privacy and focus.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-20 animate-fade-in-up delay-200">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            What Sets Us Apart
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Crystal Clear & Authentic",
                description: "Experience Uthmani script with pixel-perfect typography for a comfortable reading experience on any device."
              },
              {
                icon: Globe,
                title: "Global Understanding",
                description: "Multiple verified translations in various languages to help you grasp the meaning of the divine message."
              },
              {
                icon: Zap,
                title: "Smart Search",
                description: "Find any Surah or topic instantly. Our intelligent fuzzy search handles spelling mistakes gracefully."
              },
              {
                icon: Sparkles,
                title: "AI Assistance",
                description: "Have questions while reading? Our integrated AI assistant helps provide context and clarifications instantly."
              },
              {
                icon: Users,
                title: "Community & Tracking",
                description: "Track your reading streaks, set daily goals, and stay motivated with our insightful dashboard."
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "We respect your data. No intrusive tracking or ads. Your spiritual journey is between you and your Creator."
              }
            ].map((feature, index) => (
              <div key={index} className="glass-card p-6 border-white/5 hover:border-primary/20 transition-colors">
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team / Contribution */}
        <div className="glass-card p-10 text-center animate-fade-in-up delay-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            Built with <Heart className="w-6 h-6 text-red-500 fill-red-500" /> by the Community
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            TilawaNow is a passion project built by developers who believe in making Islamic resources open and high-quality. We are constantly improving and adding new features.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4" />
              <span>Free & Open Source</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Ad-Free Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
