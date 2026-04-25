"use client";

import { Button } from "@/components/ui/button";
import { Github, Code2, Heart } from "lucide-react";
import Link from "next/link";

export const OpenSourceSection = () => {
  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
            <Code2 className="w-3 h-3" />
            <span>AGPL v3 LICENSED</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Built by the Community, <br className="hidden md:block" />
            <span className="text-primary">For the Ummah</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed text-balance">
            TilawaNow is 100% open-source and transparent. We believe the tools for reading and understanding the Holy Qur&apos;an should be accessible to everyone, everywhere. Join our mission to build the most advanced, distraction-free Quranic platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto px-8 shadow-xl shadow-primary/20 group">
              <Link href="https://github.com/risvandev/TilawaNow" target="_blank">
                <Github className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                View on GitHub
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 bg-background/50 backdrop-blur-sm group">
              <Link href="https://github.com/risvandev/TilawaNow/issues" target="_blank">
                <Heart className="w-5 h-5 mr-2 text-destructive group-hover:scale-110 transition-transform" />
                Contribute
              </Link>
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">Open</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Source</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">Free</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Forever</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">No Ads</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Guaranteed</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">Secure</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Privacy-First</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
    </section>
  );
};
