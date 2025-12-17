export const HighlightedAyahSection = () => {
  return (
    <section className="ayah-highlight">
      <div className="relative container mx-auto px-6 py-8">
        {/* Arabic text */}
        <p className="quran-verse-large text-accent mb-6 animate-fade-in">
          إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ
        </p>
        
        {/* Translation */}
        <p className="text-lg md:text-xl text-muted-foreground mb-4 animate-fade-in delay-100 italic">
          "Indeed, this Quran guides to that which is most suitable..."
        </p>
        
        {/* Reference */}
        <p className="text-sm text-muted-foreground animate-fade-in delay-200">
          — Surah Al-Isra (17:9)
        </p>
      </div>
      
      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/60" />
    </section>
  );
};
