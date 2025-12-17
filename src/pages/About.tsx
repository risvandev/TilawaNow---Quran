import { Heart, Target, Users, Globe, BookOpen } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Quran</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A free, beautiful platform designed to help Muslims around the world connect
            with the Holy Quran.
          </p>
        </div>

        {/* Mission */}
        <div className="glass-card p-8 mb-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We believe everyone should have free, easy access to the Quran. Our mission is to
            create the most beautiful and accessible Quran reading experience, helping Muslims
            worldwide strengthen their connection with Allah's words. No barriers, no costs,
            no complications — just pure, peaceful engagement with the Holy Quran.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">What We Believe</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: "Reverence",
                description: "Built with deep respect and love for the Holy Quran.",
              },
              {
                icon: Globe,
                title: "Accessibility",
                description: "Free for everyone, everywhere, forever.",
              },
              {
                icon: Target,
                title: "Simplicity",
                description: "Easy to use, so you can focus on what matters.",
              },
              {
                icon: Users,
                title: "Community",
                description: "Serving the global Muslim community.",
              },
            ].map((value, index) => (
              <div key={index} className="feature-card text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Complete Quran with all 114 surahs and 6,236 ayahs",
              "Beautiful Arabic typography with proper Tajweed markers",
              "Audio recitation from renowned Qaris",
              "Translations in multiple languages",
              "AI-powered assistance for understanding",
              "Progress tracking and reading goals",
              "Clean, distraction-free reading experience",
              "Works on any device — completely free",
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            Quran data powered by{" "}
            <a
              href="https://quran.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Quran.com API
            </a>
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-destructive fill-destructive" /> for the Ummah
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
