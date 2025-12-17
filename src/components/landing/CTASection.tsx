import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="cta-section py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-cta-foreground mb-4">
          Begin Your Journey Today
        </h2>
        <p className="text-lg text-cta-foreground/80 max-w-xl mx-auto mb-8">
          Join thousands who have made the Quran a part of their daily life.
          No account needed — start reading in seconds.
        </p>
        <Button asChild variant="cta" size="lg">
          <Link to="/read">
            Start Reading Now
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
