import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, Languages, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    step: "1",
    title: "Choose a Surah",
    description: "Browse through all 114 surahs or search for a specific one.",
  },
  {
    icon: Headphones,
    step: "2",
    title: "Listen & Read",
    description: "Follow along with beautiful recitation while reading the verses.",
  },
  {
    icon: Languages,
    step: "3",
    title: "Understand",
    description: "Read translations in your preferred language to grasp the meaning.",
  },
];

export const QuickStartSection = () => {
  return (
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Reading in Seconds
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No registration required. Just open and begin your journey with the Quran.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative text-center opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: "forwards" }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <item.icon className="w-10 h-10 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/read">
              Start Reading Now
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
