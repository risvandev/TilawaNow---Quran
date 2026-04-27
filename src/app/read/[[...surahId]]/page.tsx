"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Pause,
  ChevronLeft,
  BookOpen,
  Volume2,
  Loader2,
  Copy,
  AlignRight,
  Info,
  RotateCcw,
  Repeat1,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Word,
  Verse,
  QURAN_STATS,
  getTranslationsByLanguage,
} from "@/lib/quran-api";
import { 
  useSurahs,
  useSurahMetadata,
  useVerses,
  useVerseAudios,
  usePriorityAudios,
  useUserReadingProfile 
} from "@/hooks/use-quran-queries";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/AppSidebar";
import { useKhatmah } from "@/contexts/KhatmahContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useReadingTracker } from "@/contexts/ReadingTrackerContext";
import { useAICompanion } from "@/contexts/AICompanionContext";
import { supabase } from "@/lib/supabase";
import { ReadingIndicator } from "@/components/ReadingIndicator";
import Fuse from "fuse.js";
import { useToast } from "@/hooks/use-toast";
import { usePrefetch } from "@/hooks/use-prefetch";
import { Virtuoso } from "react-virtuoso";

// Helper to convert English numbers to Arabic numerals
const toArabicNumerals = (num: number | string | undefined | null) => {
  if (num === undefined || num === null) return "";
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
};

// Helper to play word audio
const playWordAudio = (audioUrl: string | null) => {
  if (!audioUrl) return;
  let url = audioUrl;
  if (url.startsWith("//")) {
    url = `https:${url}`;
  } else if (!url.startsWith("http")) {
    url = `https://audio.qurancdn.com/${url}`;
  }
  const audio = new Audio(url);
  audio.play().catch(e => {
    console.error("Error playing word audio:", e);
    console.error("Attempted URL:", url);
  });
};

// Word component with hover tooltip for meaning
const WordWithMeaning = React.memo(({
  word,
  verseNumber,
  showTooltip = true,
  script = "text_uthmani",
  className,
  isHighlighted = false
}: {
  word: Word;
  verseNumber?: number;
  showTooltip?: boolean;
  script?: string;
  className?: string;
  isHighlighted?: boolean;
}) => {
  // Get Arabic text - dynamic script access with fallback
  const arabicText = (word as any)[script] || word.text_uthmani || (word as any).text || "";

  if (word.char_type_name === "end") {
    return (
      <span className={cn("inline-flex items-center justify-center relative align-middle select-none mx-0.5", className)}>
        <span className="text-[1.25em] text-muted-foreground/60 font-arabic leading-none">۝</span>
        <span className="absolute inset-0 flex items-center justify-center mt-[0.05em] text-[0.45em] font-bold text-foreground font-sans">
          {toArabicNumerals(verseNumber)}
        </span>
      </span>
    );
  }

  const content = (
    <span
      id={isHighlighted ? "active-word" : undefined}
      className={cn(
        "font-arabic cursor-pointer transition-colors duration-200 inline text-[inherit]",
        !isHighlighted && "text-inherit hover:text-accent",
        isHighlighted && "word-highlight",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        playWordAudio(word.audio_url);
      }}
    >
      {arabicText}
    </span>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-card border-border shadow-xl max-w-xs z-50 animate-in fade-in zoom-in-95 duration-200"
        sideOffset={8}
      >
        <div className="space-y-1.5 p-1">
          {word.translation && (
            <p className="text-sm font-medium text-foreground">
              {word.translation.text}
            </p>
          )}
          {word.transliteration && word.transliteration.text && (
            <p className="text-xs text-muted-foreground italic">
              {word.transliteration.text}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}, (prev, next) => {
  return prev.isHighlighted === next.isHighlighted &&
    prev.script === next.script &&
    prev.word.id === next.word.id;
});

// Verse Audio Player
const VerseAudioButton = React.memo(({
  audioUrl,
  isPlaying,
  isLoading,
  onPlay,
  onPause
}: {
  audioUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
}) => {
  if (!audioUrl) return null;

  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={isPlaying ? onPause : onPlay}
      className={cn(
        "text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
        isPlaying && "text-primary bg-primary/5"
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
});

// Verse Row Component
const VerseRow = React.memo(({
  verse,
  surahId,
  verseAudios,
  quranScript,
  isReadMode,
  status,
  isLoading,
  handleCopyVerse,
  isCurrentVerse,
  isVersePlayingNow,
  currentWordPosition,
  marked,
  onPlayVerse,
  onPlayFromVerse,
  onTogglePlay,
  onToggleMark,
  onSetLoopMode,
  onPreheat,
  loopMode
}: {
  verse: Verse,
  surahId: number,
  verseAudios: Map<string, any>,
  quranScript: string,
  isReadMode: boolean,
  status: "seen" | "read" | "engaged" | null,
  isLoading: boolean,
  handleCopyVerse: (v: Verse) => void,
  isCurrentVerse: boolean,
  isVersePlayingNow: boolean,
  currentWordPosition: number | null,
  marked: boolean,
  onPlayVerse: (v: Verse) => void,
  onPlayFromVerse: (vk: string) => void,
  onTogglePlay: () => void,
  onToggleMark: (s: number, v: number, t: 'ayah' | 'surah') => void,
  onSetLoopMode: (m: 'NONE' | 'AYAH' | 'SURAH') => void,
  onPreheat: (v: Verse) => void,
  loopMode: 'NONE' | 'AYAH' | 'SURAH'
}) => {
  const verseKey = verse.verse_key;
  const verseAudioData = verseAudios.get(verseKey);

  const handleLocalPlayVerse = (v: Verse) => {
    onPlayVerse(v);
  };

  const handleLocalPlayFromVerse = (vk: string) => {
    onPlayFromVerse(vk);
  };

  const handlePreheat = () => {
    const audioInfo = verseAudios.get(verse.verse_key);
    if (audioInfo) {
      onPreheat({ ...verse, audio: { url: audioInfo.url, segments: audioInfo.segments } });
    }
  };

  if (isReadMode) {
    const isFatihaBismillah = surahId === 1 && verse.verse_number === 1;
    const Container = isFatihaBismillah ? "div" : "span";
    return (
      <Container
        key={verse.id}
        data-ayah-id={verse.verse_number}
        className={cn(
          isFatihaBismillah 
            ? "relative block mb-12 px-4 text-center w-full" 
            : "relative inline px-0.5 transition-colors duration-500"
        )}
        id={`verse-${surahId}:${verse.verse_number}`}
      >
        <ReadingIndicator status={status} className="inline-block transform scale-75 -mr-2" />
        {verse.words?.filter(w => w.char_type_name !== "end").map((w) => (
          <React.Fragment key={w.id}>
            <WordWithMeaning
              word={w}
              verseNumber={verse.verse_number}
              showTooltip={false}
              script={quranScript}
              className={cn(isFatihaBismillah ? "text-3xl md:text-5xl" : "")}
              isHighlighted={isCurrentVerse && currentWordPosition === w.position}
            />{" "}
          </React.Fragment>
        ))}
        <span 
          className="relative inline-flex items-center justify-center mx-1.5 md:mx-3 align-middle select-none cursor-pointer group/symbol hover:scale-110 transition-transform duration-200" 
          onClick={(e) => { e.stopPropagation(); handleLocalPlayFromVerse(verse.verse_key); }}
        >
          <span className="text-foreground/20 text-[1.4em] md:text-[1.8em] group-hover/symbol:text-primary transition-colors duration-200 font-arabic leading-none">۝</span>
          <span className="absolute inset-0 flex items-center justify-center text-[0.45em] md:text-[0.6em] font-sans font-bold text-primary/80 mt-[0.1em]">
            {toArabicNumerals(verse.verse_number)}
          </span>
        </span>
      </Container>
    );
  }

  return (
    <div key={verse.id} id={`verse-${surahId}:${verse.verse_number}`} data-ayah-id={verse.verse_number} className={cn("glass-card p-4 md:p-5 opacity-0 animate-fade-in group transition-all duration-500 virtual-row", isCurrentVerse && "border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)] ring-1 ring-primary/20 scale-[1.01]")} style={{ animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onToggleMark(surahId, verse.verse_number, 'ayah')}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-sm mx-1 shrink-0",
                marked
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/40"
              )}
              title={marked ? "Unmark Ayah" : "Mark Ayah"}
            >
              {marked ? 'Marked' : 'Mark'}
            </button>
            <VerseAudioButton audioUrl={verseAudioData?.url || null} isPlaying={isVersePlayingNow} isLoading={isLoading && isCurrentVerse} onPlay={() => handleLocalPlayVerse(verse)} onPause={onTogglePlay} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleLocalPlayFromVerse(verse.verse_key)} 
              onMouseEnter={handlePreheat} 
              className="h-auto py-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-md transition-all duration-300" 
              title="Continue from here"
            >
              Continue
            </Button>
            <Button variant="ghost" size="iconSm" onClick={() => { handleLocalPlayVerse(verse); onSetLoopMode(loopMode === 'AYAH' ? 'NONE' : 'AYAH'); }} onMouseEnter={handlePreheat} className={cn("hover:bg-primary/10", (loopMode === 'AYAH' && isCurrentVerse) ? "text-primary" : "text-muted-foreground")} title="Repeat Ayah"><Repeat1 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="iconSm" onClick={() => handleCopyVerse(verse)} className="text-muted-foreground hover:text-primary hover:bg-primary/10" title="Copy Ayah"><Copy className="w-4 h-4" /></Button>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="iconSm" className="text-muted-foreground h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-xl">
                <DropdownMenuItem onClick={() => handleCopyVerse(verse)} className="gap-2 focus:bg-primary/10 focus:text-primary">
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Copy Ayah</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { handleLocalPlayVerse(verse); onSetLoopMode(loopMode === 'AYAH' ? 'NONE' : 'AYAH'); }} className="gap-2 focus:bg-primary/10 focus:text-primary">
                  <Repeat1 className={cn("w-3.5 h-3.5", (loopMode === 'AYAH' && isCurrentVerse) ? "text-primary" : "")} />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Repeat Ayah</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => onToggleMark(surahId, verse.verse_number, 'ayah')}
              className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all duration-300 border backdrop-blur-sm shrink-0",
                marked
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              )}
            >
              {marked ? 'Marked' : 'Mark'}
            </button>
            <VerseAudioButton audioUrl={verseAudioData?.url || null} isPlaying={isVersePlayingNow} isLoading={isLoading && isCurrentVerse} onPlay={() => handleLocalPlayVerse(verse)} onPause={onTogglePlay} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleLocalPlayFromVerse(verse.verse_key)} 
              className="h-auto py-0.5 px-2 text-[9px] font-bold uppercase tracking-tight text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-md transition-all duration-300"
            >
              Continue
            </Button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{verseKey}</span>
      </div>
      <div className={`w-full mb-3 py-6 md:py-8 text-2xl md:text-5xl ${surahId === 1 && verse.verse_number === 1 ? 'text-center' : 'text-right'}`} dir="rtl" style={{ lineHeight: 2.8 }}>
        <div className="inline" style={{ wordSpacing: "normal" }}>
          {(verse.words && verse.words.length > 0) ? verse.words.map((w) => (
            <React.Fragment key={w.id}>
              <WordWithMeaning word={w} verseNumber={verse.verse_number} showTooltip={true} script={quranScript} isHighlighted={isCurrentVerse && currentWordPosition === w.position} />{" "}
            </React.Fragment>
          )) : <p className="quran-verse">{verse.text_uthmani}</p>}
        </div>
      </div>
      {verse.translations && verse.translations[0] && <div className="border-t border-border/50 pt-4"><p className="text-muted-foreground text-sm md:text-base leading-relaxed text-left">{verse.translations[0].text.replace(/<[^>]*>/g, "")}</p></div>}
    </div>
  );
}, (prev, next) => {
  return (
    prev.verse.id === next.verse.id &&
    prev.isCurrentVerse === next.isCurrentVerse &&
    prev.isVersePlayingNow === next.isVersePlayingNow &&
    prev.currentWordPosition === next.currentWordPosition &&
    prev.marked === next.marked &&
    prev.isLoading === next.isLoading &&
    prev.loopMode === next.loopMode &&
    prev.isReadMode === next.isReadMode &&
    prev.status === next.status &&
    prev.quranScript === next.quranScript
  );
});

// Surah List Component
const SurahList = () => {
  const { prefetchSurahData } = usePrefetch();
  const { data: surahs = [], isLoading: isSurahsLoading } = useSurahs();
  const { toggleMark, isMarked } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState("");
  const { isKhatmahActive, currentProgress, isLoading: isKhatmahLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const router = useRouter();
  const { isExpanded, isHovered } = useSidebar();
  const isSidebarOpen = isExpanded || isHovered;

  const fuse = new Fuse(surahs, {
    keys: ["name_simple", "name_arabic", "translated_name.name", "id", "revelation_place"],
    threshold: 0.4,
    distance: 100,
  });

  const filteredSurahs = !searchQuery 
    ? surahs 
    : fuse.search(searchQuery).map(result => result.item);

  if (isSurahsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-6 py-8 transition-all duration-300",
      !isSidebarOpen ? "max-w-7xl" : "max-w-5xl"
    )}>
      <div className="mb-8 flex flex-row items-start md:items-end justify-between gap-2 md:gap-4">
        <div className="min-w-0 shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2 whitespace-nowrap">Read Quran</h1>
          <p className="text-sm md:text-base text-muted-foreground whitespace-nowrap">
            {QURAN_STATS.totalSurahs} Surahs • {QURAN_STATS.totalAyahs.toLocaleString()} Ayahs
          </p>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {currentProgress && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 md:h-10 md:w-10 shadow-sm shrink-0"
              onClick={async () => {
                if (confirm("Are you sure you want to restart your Khatmah from the beginning?")) {
                  await restartKhatmah();
                }
              }}
              disabled={isKhatmahLoading}
              title="Restart Khatmah"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          )}

          <Button
            variant="hero"
            className="gap-1.5 md:gap-2 shadow-lg shadow-primary/20 h-8 px-2.5 text-xs md:h-10 md:px-4 md:text-sm shrink-0"
            onClick={async () => {
              if (isKhatmahActive) {
                stopKhatmah();
              } else {
                await startKhatmah();
                const targetSurah = currentProgress?.surah_id || 1;
                router.push(`/read/${targetSurah}`);
              }
            }}
            disabled={isKhatmahLoading}
          >
            {isKhatmahLoading ? (
              <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
            ) : isKhatmahActive ? (
              <>
                <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="md:hidden">Stop</span>
                <span className="hidden md:inline">Stop Khatmah</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="md:hidden">{currentProgress ? "Resume" : "khatmah"}</span>
                <span className="hidden md:inline">{currentProgress ? "Resume Khatmah" : "Start Khatmah"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search surahs, topics, or meanings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredSurahs.map((surah, index) => {
          const marked = isMarked(surah.id, null, 'surah');
          return (
            <Link
              key={surah.id}
              href={`/read/${surah.id}`}
              onMouseEnter={() => prefetchSurahData(surah.id)}
              className="group relative flex flex-row md:flex-col items-center md:items-stretch glass-card overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in p-3 md:p-0"
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMark(surah.id, null, 'surah');
                }}
                className={cn(
                  "absolute top-4 right-4 z-10 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-sm hidden md:block",
                  marked
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                    : "bg-background/40 border-white/20 text-white/70 hover:bg-background/60 hover:border-white/40"
                )}
              >
                {marked ? 'Marked' : 'Mark'}
              </button>

              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMark(surah.id, null, 'surah');
                }}
                className={cn(
                  "md:hidden w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm mr-4 shadow-sm transition-all duration-300 cursor-pointer active:scale-90",
                  marked 
                    ? "bg-primary text-white border-primary shadow-primary/20" 
                    : "bg-primary/10 border border-primary/20 text-primary"
                )}
              >
                {surah.id}
              </div>

              <div className="hidden md:flex aspect-video md:aspect-[3/2] w-full bg-gradient-to-b from-primary/5 to-transparent items-center justify-center p-4 relative group-hover:from-primary/10 transition-colors duration-300">
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMark(surah.id, null, 'surah');
                  }}
                  className={cn(
                    "absolute top-4 left-4 w-10 h-10 rounded-lg backdrop-blur-sm border flex items-center justify-center font-bold shadow-sm transition-all duration-300 cursor-pointer active:scale-95 z-20",
                    marked
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                      : "bg-background/50 border-border text-foreground hover:bg-background/80"
                  )}
                  title={marked ? "Unmark Surah" : "Mark Surah"}
                >
                  {surah.id}
                </div>
                <p className="font-arabic text-4xl md:text-5xl text-foreground/90 group-hover:text-primary transition-colors duration-300 drop-shadow-sm text-center leading-relaxed py-4 translate-y-4">
                  {surah.name_arabic}
                </p>
              </div>

              <div className="flex-1 min-w-0 flex flex-row md:flex-col items-center md:items-stretch justify-between md:p-4 md:bg-card md:border-t md:border-border/50">
                <div className="min-w-0 pr-2">
                  <h3 className="font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors truncate">
                    {surah.name_simple}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate opacity-70">
                    {surah.translated_name.name}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 md:hidden">
                  <span className="font-arabic text-2xl text-foreground/90 group-hover:text-primary transition-colors mb-0.5">
                    {surah.name_arabic}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    {surah.verses_count} Ayahs
                  </span>
                </div>

                <div className="hidden md:flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {surah.verses_count} Ayahs
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider opacity-60">
                    {surah.revelation_place}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Surah Reader Component
const SurahReader = ({ surahId }: { surahId: number }) => {
  const { toast } = useToast();
  const { prefetchSurahData } = usePrefetch();
  const [translationId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("quranTranslation") || "20" : "20";
  });
  const [isReadMode, setIsReadMode] = useState(false);
  const [quranScript] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem("quranScript") || "text_uthmani" : "text_uthmani";
  });

  const { user } = useAuth();
  const surah = useSurahMetadata(surahId);
  const { data: userReadingProfile } = useUserReadingProfile(user?.id);
  const { data: priorityAudios } = usePriorityAudios(surahId);
  const { data: versesData, isLoading: isVersesLoading } = useVerses(surahId, parseInt(translationId), quranScript);
  const verses = versesData?.verses || [];
  const { data: verseAudios = new Map(), isLoading: isAudiosLoading } = useVerseAudios(surahId);

  const loading = isVersesLoading || isAudiosLoading;

  const combinedAudios = useMemo(() => {
    const map = new Map(verseAudios);
    if (priorityAudios) {
      priorityAudios.forEach((v, k) => map.set(k, v));
    }
    return map;
  }, [verseAudios, priorityAudios]);

  const versesByPage = useMemo(() => {
    return verses.reduce((acc: Record<number, Verse[]>, v) => {
      const p = v.page_number;
      if (!acc[p]) acc[p] = [];
      acc[p].push(v);
      return acc;
    }, {});
  }, [verses]);

  const pages = useMemo(() => Object.entries(versesByPage), [versesByPage]);

  const { 
    preheatAudio, 
    currentVerseKey, 
    currentWordPosition, 
    isPlaying, 
    togglePlay, 
    playSurah,
    playVerse: playVerseGlobal,
    currentSurah: activeSurah,
    isLoading,
    loopMode,
    setLoopMode,
  } = useAudioPlayer();
  const isMobile = useIsMobile();


  const { updateReadingHistory, isMarked, toggleMark } = useBookmarks();
  const { updateCurrentContext } = useAICompanion();
  const { startSession, logSignal, ayahStates } = useReadingTracker();
  const lastLoggedVerseRef = useRef<string | null>(null);
  const visibleAyahsRef = useRef<Set<number>>(new Set());
  const virtuosoRef = useRef<any>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logVerseReading = useCallback((sId: number, vKey: string) => {
    if (lastLoggedVerseRef.current === vKey) return;
    updateReadingHistory(sId, vKey);
    lastLoggedVerseRef.current = vKey;

    const ayahNum = parseInt(vKey.split(":")[1]);
    if (!isNaN(ayahNum)) {
      updateCurrentContext(sId, ayahNum, vKey);
    }
  }, [updateReadingHistory, updateCurrentContext]);

  useEffect(() => {
    const currentAudioMap = (priorityAudios?.size ? priorityAudios : verseAudios) as Map<string, any>;
    
    if (!isVersesLoading && verses.length > 0 && currentAudioMap?.size > 0 && !isPlaying && activeSurah?.id !== surahId) {
      const firstVerse = verses[0];
      const info1 = currentAudioMap.get(firstVerse.verse_key);
      if (info1) {
        preheatAudio({ ...firstVerse, audio: { url: info1.url, segments: info1.segments } }, 'ACTIVE');
      }

      if (verses.length > 1) {
        const secondVerse = verses[1];
        const info2 = currentAudioMap.get(secondVerse.verse_key);
        if (info2) {
          preheatAudio({ ...secondVerse, audio: { url: info2.url, segments: info2.segments } }, 'INACTIVE');
        }
      }
    }
  }, [isVersesLoading, verses, priorityAudios, verseAudios, preheatAudio, isPlaying, activeSurah, surahId]);

  useEffect(() => {
    const currentAudioMap = (priorityAudios?.size ? priorityAudios : verseAudios) as Map<string, any>;

    if (!isVersesLoading && verses.length > 0 && userReadingProfile?.last_read_surah === surahId && currentAudioMap?.size > 0 && !isPlaying) {
      const lastVerseNumber = userReadingProfile.last_read_ayah;
      const lastVerse = verses.find(v => v.verse_number === lastVerseNumber);
      if (lastVerse) {
        const info = currentAudioMap.get(lastVerse.verse_key);
        if (info) {
          const verseWithAudio = { ...lastVerse, audio: { url: info.url, segments: info.segments } };
          preheatAudio(verseWithAudio, 'ACTIVE');
          
          const nextIdx = verses.findIndex(v => v.verse_number === lastVerseNumber) + 1;
          if (nextIdx < verses.length) {
            const nextVerse = verses[nextIdx];
            const nextInfo = currentAudioMap.get(nextVerse.verse_key);
            if (nextInfo) {
               preheatAudio({ ...nextVerse, audio: { url: nextInfo.url, segments: nextInfo.segments } }, 'INACTIVE');
            }
          }
        }
      }
    }
  }, [isVersesLoading, verses, userReadingProfile, surahId, preheatAudio, priorityAudios, verseAudios, isPlaying]);

  const handleToggleMark = useCallback((s: number, v: number, t: 'ayah' | 'surah') => {
    toggleMark(s, v, t);
  }, [toggleMark]);

  const handleSetLoopMode = useCallback((m: 'NONE' | 'AYAH' | 'SURAH') => {
    setLoopMode(m);
  }, [setLoopMode]);

  const handlePlayVerseCallback = useCallback((verse: Verse) => {
    const key = verse.verse_key;
    const audioInfo = combinedAudios.get(key);
    if (!audioInfo) return;
    const verseWithAudio = { ...verse, audio: { url: audioInfo.url, segments: audioInfo.segments } };
    if (isPlaying && currentVerseKey !== key.toString()) {
      setPendingAction(() => () => { if (surah) playVerseGlobal(verseWithAudio, surah); });
      setShowConfirmDialog(true);
    } else if (currentVerseKey === key.toString()) {
      togglePlay();
    } else {
      if (surah) playVerseGlobal(verseWithAudio, surah);
    }
  }, [combinedAudios, isPlaying, currentVerseKey, togglePlay, playVerseGlobal, surah]);

  const handlePlayFromVerseCallback = useCallback((verseKey: string) => {
    if (!surah) return;
    const playlist = verses.map(v => {
      const audioInfo = combinedAudios.get(v.verse_key);
      return {
        ...v,
        audio: {
          url: audioInfo?.url || v.audio?.url || "",
          segments: audioInfo?.segments
        }
      };
    });
    const resumeVerse = verseKey;
    if (isPlaying) {
      setPendingAction(() => () => playSurah(surah, playlist, resumeVerse));
      setShowConfirmDialog(true);
    } else {
      playSurah(surah, playlist, resumeVerse);
    }
  }, [verses, combinedAudios, isPlaying, playSurah, surah]);

  const handleCopyVerseCallback = useCallback((verse: Verse) => {
    const arabicText = verse.text_uthmani;
    const translationText = verse.translations?.[0]?.text.replace(/<[^>]*>/g, "") || "";
    const copyText = `${arabicText}\n\n${translationText}\n[Quran ${surahId}:${verse.verse_number}]`;
    navigator.clipboard.writeText(copyText);
    toast({ title: "Verse Copied", description: `Ayah ${surahId}:${verse.verse_number} copied to clipboard` });
    logSignal(surahId, verse.verse_number, "interaction");
  }, [surahId, toast, logSignal]);

  const [historicalStates, setHistoricalStates] = useState<Record<string, "seen" | "read" | "engaged" | null>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      if (!surahId) return;
      const { data } = await supabase
        .from("reading_activity")
        .select("ayah_id, status")
        .eq("surah_id", surahId)
        .order("timestamp", { ascending: false });

      if (data) {
        const states: Record<string, "seen" | "read" | "engaged" | null> = {};
        data.forEach(item => {
          const key = `${surahId}:${item.ayah_id}`;
          if (!states[key]) states[key] = item.status as any;
        });
        setHistoricalStates(states);
      }
    };
    fetchHistory();
  }, [surahId]);

  // Detect manual scrolling to pause auto-scroll
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      
      // If playing, set a timer to resume auto-scroll after 3 seconds of inactivity
      if (isPlaying) {
        inactivityTimerRef.current = setTimeout(() => {
          setIsAutoScrollEnabled(true);
        }, 3000);
      }
    };

    const handleUserScroll = () => {
      if (userScrollingRef.current) return;
      
      // If we detect a scroll that wasn't triggered by our code
      setIsAutoScrollEnabled(false);
      resetInactivityTimer();
    };

    const handleTouchStart = () => { 
      userScrollingRef.current = true; 
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };

    const handleTouchEnd = () => { 
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 1000);
      resetInactivityTimer();
    };

    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('mousedown', resetInactivityTimer, { passive: true });
    window.addEventListener('keydown', resetInactivityTimer, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isPlaying]);
  
  // Handle manual scroll to current ayah request
  useEffect(() => {
    const handleScrollToAyah = (e: any) => {
      const verseKey = e.detail?.verseKey;
      if (!verseKey) return;
      
      const verseIndex = verses.findIndex(v => v.verse_key === verseKey);
      if (verseIndex >= 0) {
        // When user explicitly clicks "scroll to ayah", re-enable auto-scroll
        setIsAutoScrollEnabled(true);
        userScrollingRef.current = true;

        if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: verseIndex,
            align: 'center',
            behavior: 'smooth'
          });
        } else {
          // Fallback for non-virtualized mode (e.g. Reading Mode)
          const element = document.getElementById(`verse-${verseKey}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }

        // Reset userScrolling after animation
        setTimeout(() => {
          userScrollingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll-to-ayah', handleScrollToAyah);
    return () => window.removeEventListener('scroll-to-ayah', handleScrollToAyah);
  }, [verses]);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const translationsByLanguage = getTranslationsByLanguage();
  const sessionStartedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && surah && sessionStartedRef.current !== surahId) {
      logVerseReading(surahId, `${surahId}:1`);
      startSession(surahId);
      sessionStartedRef.current = surahId;

      if (surahId < 114) {
        prefetchSurahData(surahId + 1, parseInt(translationId), quranScript);
      }
    }
  }, [surahId, loading, surah, logVerseReading, startSession, prefetchSurahData, translationId, quranScript]);
  
  useEffect(() => {
    if (isMobile && isPlaying && currentWordPosition !== undefined) {
        }
      });
    }
  }, [currentWordPosition, currentVerseKey, isPlaying, isMobile]);

  useEffect(() => {
    if (!loading && currentVerseKey && currentVerseKey.startsWith(`${surahId}:`)) {
      const verseIndex = verses.findIndex(v => v.verse_key === currentVerseKey);
      
      if (verseIndex >= 0) {
      if (verseIndex >= 0 && isPlaying && isAutoScrollEnabled) {
        userScrollingRef.current = true;
        if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: verseIndex,
            align: 'center',
            behavior: 'smooth'
          });
        } else {
          const element = document.getElementById(`verse-${currentVerseKey}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        
        // Reset userScrolling after animation
        setTimeout(() => {
          userScrollingRef.current = false;
        }, 1000);
      }
      }

      logVerseReading(surahId, currentVerseKey);
      const ayahId = parseInt(currentVerseKey.split(":")[1]);
      if (!isNaN(ayahId)) {
        logSignal(surahId, ayahId, "interaction");
      }
    }
  }, [currentVerseKey, surahId, logVerseReading, loading, logSignal, verses]);

  const confirmPlaybackSwitch = () => {
    if (pendingAction) pendingAction();
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const cancelPlaybackSwitch = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const { isExpanded, isHovered } = useSidebar();
  const isSidebarOpen = isExpanded || isHovered;

  const handleItemsRendered = useCallback((items: any[]) => {
    visibleAyahsRef.current.clear();
    items.forEach(item => {
      if (item.data?.verse_number) {
        visibleAyahsRef.current.add(item.data.verse_number);
      }
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    const heartbeat = setInterval(() => {
      visibleAyahsRef.current.forEach((ayahId) => {
        logSignal(surahId, ayahId, "visibility");
      });
    }, 1500);

    return () => clearInterval(heartbeat);
  }, [surahId, loading, logSignal]);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        visibleAyahsRef.current.forEach((ayahId) => {
          logSignal(surahId, ayahId, "scroll");
        });
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [surahId, logSignal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <p className="text-muted-foreground">Surah not found.</p>
        <Button asChild variant="hero" className="mt-4">
          <Link href="/read">Back to Surahs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-6 py-8 transition-all duration-300",
      !isSidebarOpen ? "max-w-7xl" : "max-w-5xl"
    )}>
      <Link href="/read" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden md:inline">Back to Surahs</span>
      </Link>

      <div className="mb-8 px-4 md:px-0">
        <div className="text-center mb-6 md:mb-8 pt-2 md:pt-4">
          <h1 className="font-arabic text-3xl md:text-7xl text-foreground mb-1 md:mb-2 leading-tight">
            سورة {surah.name_arabic}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">{surah.name_simple}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border/40 pb-6 relative">
          <div className="text-center md:text-left w-full md:w-1/3 order-2 md:order-1">
            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Translation by</p>
            <p className="font-medium text-foreground text-sm md:text-lg">
              {Object.values(translationsByLanguage).flat().find(t => t.id.toString() === translationId)?.name || "Sahih International"}
            </p>
          </div>

          <div className="w-full md:w-1/3 flex justify-center order-1 md:order-2">
            <div className="bg-secondary/50 p-1 rounded-lg inline-flex items-center backdrop-blur-sm border border-border/50 scale-90 md:scale-100 origin-center">
              <button onClick={() => setIsReadMode(false)} className={cn("px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 md:gap-2", !isReadMode ? "bg-background text-primary shadow-sm ring-1 ring-border/10" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                <AlignRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Translation
              </button>
              <button onClick={() => setIsReadMode(true)} className={cn("px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 md:gap-2", isReadMode ? "bg-background text-primary shadow-sm ring-1 ring-border/10" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Reading
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5 w-full md:w-1/3 order-3 scale-95 md:scale-100 origin-center md:origin-right">
            <Link href={`/info/${surahId}`}>
              <Button variant="ghost" size="sm" className="h-auto py-1 gap-2 text-[10px] md:text-xs text-muted-foreground/80 hover:text-foreground hover:bg-transparent px-2">
                <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>Surah Info</span>
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Link href={`/story/${surahId}`}>
                <Button variant="ghost" size="sm" className="h-auto py-1 gap-2 text-[10px] md:text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 px-2">
                  <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Surah Explained</span>
                </Button>
              </Link>

              {(combinedAudios.size > 0) && (
                <Button variant="ghost" size="sm" className={cn("gap-2 font-bold hover:bg-primary/10 px-3 py-1 rounded-full text-[10px] md:text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-400/20")} onClick={() => {
                  const playlist = verses.map(v => {
                    const audioInfo = combinedAudios.get(v.verse_key);
                    return { 
                      ...v, 
                      audio: { 
                        url: audioInfo?.url || "", 
                        segments: audioInfo?.segments 
                      } 
                    };
                  });
                  const resumeVerse = activeSurah?.id === surahId ? currentVerseKey : undefined;
                  playSurah(surah, playlist, resumeVerse || undefined);
                }}>
                  <span>{activeSurah?.id === surahId ? "CONTINUE" : "PLAY AUDIO"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {surah.id !== 1 && surah.id !== 9 && (
        <div className="text-center mb-10 py-8 cursor-pointer group transition-all duration-300 hover:bg-primary/5 rounded-xl" onClick={() => (new Audio("https://verses.quran.com/Alafasy/mp3/001001.mp3")).play()} title="Tap to listen">
          <p className="font-arabic text-2xl md:text-3xl lg:text-4xl text-white leading-relaxed group-hover:text-accent transition-colors duration-300">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {isReadMode ? (
        <div className="min-h-[80vh] optimize-gpu">
          <Virtuoso
            useWindowScroll
            data={pages}
            increaseViewportBy={2000}
            itemContent={(_index, [pageNumber, pageVerses]) => (
              <div key={pageNumber} className="max-w-4xl mx-auto py-12 mushaf-layout text-foreground relative" dir="rtl">
                <div className="mb-4">
                  {pageVerses.map((verse) => (
                    <VerseRow
                      key={verse.id}
                      verse={verse}
                      surahId={surahId}
                      verseAudios={combinedAudios}
                      quranScript={quranScript}
                      isReadMode={true}
                      status={ayahStates[`${surahId}:${verse.verse_number}`] || historicalStates[`${surahId}:${verse.verse_number}`]}
                      isLoading={isLoading}
                      handleCopyVerse={handleCopyVerseCallback}
                      isCurrentVerse={currentVerseKey === verse.verse_key}
                      isVersePlayingNow={currentVerseKey === verse.verse_key && isPlaying}
                      currentWordPosition={currentVerseKey === verse.verse_key ? currentWordPosition : null}
                      marked={isMarked(surahId, verse.verse_number, 'ayah')}
                      onPlayVerse={handlePlayVerseCallback}
                      onPlayFromVerse={handlePlayFromVerseCallback}
                      onTogglePlay={togglePlay}
                      onToggleMark={handleToggleMark}
                      onSetLoopMode={handleSetLoopMode}
                      onPreheat={preheatAudio}
                      loopMode={loopMode}
                    />
                  ))}
                </div>
                <div className="mt-12 pt-6 border-t border-border w-full flex justify-center text-sm font-sans text-muted-foreground select-none">Page {pageNumber}</div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="min-h-[80vh] optimize-gpu">
          <Virtuoso
            ref={virtuosoRef}
            useWindowScroll
            data={verses}
            initialTopMostItemIndex={(() => {
              const idx = currentVerseKey ? verses.findIndex(v => v.verse_key === currentVerseKey) : 0;
              return idx >= 0 ? idx : 0;
            })()}
            increaseViewportBy={2500}
            itemsRendered={handleItemsRendered}
            itemContent={(_index, verse) => (
              <div className="pb-4 px-1">
                <VerseRow
                  verse={verse}
                  surahId={surahId}
                  verseAudios={verseAudios}
                  quranScript={quranScript}
                  isReadMode={false}
                  status={ayahStates[`${surahId}:${verse.verse_number}`] || historicalStates[`${surahId}:${verse.verse_number}`]}
                  isLoading={isLoading}
                  handleCopyVerse={handleCopyVerseCallback}
                  isCurrentVerse={currentVerseKey === verse.verse_key}
                  isVersePlayingNow={currentVerseKey === verse.verse_key && isPlaying}
                  currentWordPosition={currentVerseKey === verse.verse_key ? currentWordPosition : null}
                  marked={isMarked(surahId, verse.verse_number, 'ayah')}
                  onPlayVerse={handlePlayVerseCallback}
                  onPlayFromVerse={handlePlayFromVerseCallback}
                  onTogglePlay={togglePlay}
                  onToggleMark={handleToggleMark}
                  onSetLoopMode={handleSetLoopMode}
                  onPreheat={preheatAudio}
                  loopMode={loopMode}
                />
              </div>
            )}
          />
        </div>
      )}

      <div className="text-center py-12">
        <p className="text-muted-foreground">End of {surah.name_simple}</p>
        {surahId < 114 && <Button asChild variant="hero" className="mt-4"><Link href={`/read/${surahId + 1}`}>Next Surah</Link></Button>}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Interrupt current playback?</AlertDialogTitle><AlertDialogDescription>Another audio is currently playing. Do you want to stop it and play this instead?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={cancelPlaybackSwitch}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmPlaybackSwitch}>Play New</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ReadQuran = () => {
  const { surahId } = useParams();
  if (surahId) {
    const sIdStr = Array.isArray(surahId) ? surahId[0] : surahId;
    const sId = parseInt(sIdStr);
    return <SurahReader surahId={sId} />;
  }
  return <SurahList />;
};

export default ReadQuran;
