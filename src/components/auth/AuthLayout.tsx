"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  quote?: {
    text: string;
    reference: string;
  };
}

export const AuthLayout = ({ children, title, subtitle, quote }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Visual Area (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative items-center justify-center overflow-hidden bg-muted">
        <Image
          src="/auth_side_panel.png"
          alt="Serene Background"
          fill
          priority
          className="object-cover object-center opacity-90 scale-105 animate-slow-zoom"
          sizes="50vw"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />

        <div className="relative z-10 p-12 lg:p-20 flex flex-col h-full justify-between items-start text-white w-full">
          <div className="animate-fade-in delay-200">
            <Logo 
              className="gap-4"
              iconClassName="w-12 h-12 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
              textClassName="text-3xl font-bold text-white drop-shadow-lg"
              arabicClassName="text-4xl"
            />
          </div>

          {quote && (
            <div className="max-w-xl animate-fade-in-up delay-500">
              <div className="w-12 h-1 bg-primary mb-8 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              <p className="text-2xl lg:text-3xl leading-relaxed mb-6 drop-shadow-xl text-white/95 italic font-light tracking-wide">
                "{quote.text}"
              </p>
              <p className="text-primary font-medium tracking-widest uppercase text-sm drop-shadow-md">
                — {quote.reference}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Form Area */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col p-6 md:p-12 lg:p-16 relative z-10 bg-background border-l border-border/40">
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full animate-fade-in">
          <div className="mb-10 md:mb-16">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground mb-4 leading-[1.1]">
              {title}
            </h1>
            <p className="text-muted-foreground text-xl font-light tracking-wide max-w-sm">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center md:text-left">
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} TilawaNow. Built for reflection.
          </p>
        </div>
      </div>
    </div>
  );
};
