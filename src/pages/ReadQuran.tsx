import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
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
  LayoutGrid,
  AlignRight,
  Info,
  Sparkles,
  MessageCircle,
  PlayCircle,
  Target,
  RotateCcw
} from "lucide-react";
import {
  fetchSurahs,
  fetchVerses,
  fetchChapterAudio,
  fetchChapterVerseAudios,
  Surah,
  Verse,
  Word,
  QURAN_STATS,
  TRANSLATIONS,
  getTranslationsByLanguage,
  getPreferredReciterId,
} from "@/lib/quran-api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useKhatmah } from "@/contexts/KhatmahContext";

// Helper to convert English numbers to Arabic numerals
const toArabicNumerals = (num: number | string | undefined | null) => {
  if (num === undefined || num === null) return "";
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
};

// Helper to play word audio
const playWordAudio = (audioUrl: string | null) => {
  if (!audioUrl) return;
  const url = audioUrl.startsWith("http") ? audioUrl : `https://audio.qurancdn.com/${audioUrl}`;
  const audio = new Audio(url);
  audio.play().catch(e => console.error("Error playing word audio:", e));
};

// Word component with hover tooltip for meaning
// Word component with hover tooltip for meaning
const WordWithMeaning = ({
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
      <span className="inline-flex items-center justify-center relative w-[0.8em] h-[0.8em] align-middle mx-1 select-none">
        <span className="text-[1em] text-accent/80 font-arabic">۝</span>
        <span className="absolute inset-0 flex items-center justify-center pt-[0.1em] text-[0.4em] font-bold text-foreground font-sans">
          {toArabicNumerals(verseNumber)}
        </span>
      </span>
    );
  }

  const content = (
    <span
      className={cn(
        "font-arabic cursor-pointer transition-all duration-200 inline-block text-[inherit] leading-relaxed mx-0.5 active:scale-95",
        !isHighlighted && "text-inherit hover:text-accent",
        // Updated highlight style: Primary color, bold, and distinct underline
        isHighlighted && "text-primary font-extrabold scale-110 underline decoration-2 decoration-primary underline-offset-8 !text-primary !opacity-100",
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
        className="bg-card border-border shadow-xl max-w-xs z-50"
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
};

// Verse Audio Player
const VerseAudioButton = ({
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
      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
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
};

import { searchWithAI } from "@/lib/ai-service";
import Fuse from "fuse.js";
import { useToast } from "@/hooks/use-toast";

// Surah List View
const SurahList = () => {
  const { toast } = useToast();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiMatches, setAiMatches] = useState<number[] | null>(null);
  const { isKhatmahActive, currentProgress, isLoading, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      setSurahs(data);
      setLoading(false);
    };
    loadSurahs();
  }, []);

  // Debounced AI Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 3) {
        setAiSuggestion(null);
        setAiMatches(null);
        return;
      }

      setIsSearchingAI(true);
      try {
        const result = await searchWithAI(searchQuery, undefined, surahs);

        if (result.suggestedQuery && result.suggestedQuery.toLowerCase() !== searchQuery.toLowerCase()) {
          setAiSuggestion(result.suggestedQuery);
        } else {
          setAiSuggestion(null);
        }

        if (result.matchedSurahs && result.matchedSurahs.length > 0) {
          setAiMatches(result.matchedSurahs);
        }
      } catch (error) {
        console.error("AI Search Failed:", error);
        // Fallback to normal search, no toast needed to avoid annoyance
      } finally {
        setIsSearchingAI(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, surahs]);

  const fuse = new Fuse(surahs, {
    keys: ["name_simple", "name_arabic", "translated_name.name", "id", "revelation_place"],
    threshold: 0.4,
    distance: 100,
  });

  // Combine AI matches with Fuse results
  const getFilteredSurahs = () => {
    if (!searchQuery) return surahs;

    // If we have AI matches, prioritize them
    if (aiMatches && aiMatches.length > 0) {
      const aiResults = surahs.filter(s => aiMatches.includes(s.id));
      // Sort by order in aiMatches
      aiResults.sort((a, b) => aiMatches.indexOf(a.id) - aiMatches.indexOf(b.id));
      return aiResults;
    }

    // Fallback to Fuse
    return fuse.search(searchQuery).map(result => result.item);
  };

  const filteredSurahs = getFilteredSurahs();

  const handleSuggestionClick = () => {
    if (aiSuggestion) {
      setSearchQuery(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { isExpanded, isHovered } = useSidebar();
  const isSidebarOpen = isExpanded || isHovered;

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
              disabled={isLoading}
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
                navigate(`/read/${targetSurah}`);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
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
                <span className="md:hidden">{currentProgress ? "Resume" : "Start"}</span>
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
        {isSearchingAI && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* AI Suggestion Chip */}
      {aiSuggestion && (
        <div className="mb-6 flex items-center gap-2 animate-fade-in">
          <span className="text-sm text-muted-foreground">Did you mean:</span>
          <button
            onClick={handleSuggestionClick}
            className="text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
          >
            {aiSuggestion}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredSurahs.map((surah, index) => (
          <Link
            key={surah.id}
            to={`/read/${surah.id}`}
            className="group relative flex flex-col glass-card overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
          >
            {/* Cover Area (Arabic Name) */}
            <div className="aspect-video md:aspect-[4/5] w-full bg-gradient-to-b from-primary/5 to-transparent flex items-center justify-center p-6 relative group-hover:from-primary/10 transition-colors duration-300">
              {/* Surah Number Badge */}
              <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-background/50 backdrop-blur-sm border border-border flex items-center justify-center font-bold text-foreground shadow-sm">
                {surah.id}
              </div>

              {/* Revelation Place Badge */}
              <span className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full bg-secondary/80 backdrop-blur-sm text-foreground capitalize border border-border/50">
                {surah.revelation_place}
              </span>

              {/* Arabic Name (The "Product") */}
              <p className="font-arabic text-4xl md:text-5xl text-foreground/90 group-hover:text-primary transition-colors duration-300 drop-shadow-sm text-center leading-relaxed py-4">
                {surah.name_arabic}
              </p>
            </div>

            {/* Product Details (Bottom Info) */}
            <div className="p-4 bg-card border-t border-border/50">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {surah.name_simple}
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  {surah.verses_count} Ayahs
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {surah.translated_name.name}
              </p>
            </div>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-500" />
          </Link>
        ))}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No surahs found matching your search.</p>
        </div>
      )}
    </div>
  );
};

// Surah Reader View with enhanced features
const SurahReader = ({ surahId }: { surahId: number }) => {
  const { toast } = useToast();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationId, setTranslationId] = useState(() => {
    return localStorage.getItem("quranTranslation") || "20";
  });

  const [verseAudios, setVerseAudios] = useState<Map<string, { url: string; segments: number[][] }>>(new Map());

  const [surah, setSurah] = useState<Surah | null>(null);
  const [isReadMode, setIsReadMode] = useState(false);
  const [quranScript, setQuranScript] = useState(() => {
    return localStorage.getItem("quranScript") || "text_uthmani";
  });

  // Global Audio Context
  const {
    playSurah,
    playVerse: playVerseGlobal,
    togglePlay,
    isPlaying,
    currentVerseKey,
    currentWordPosition,
    isLoading: isGlobalLoading
  } = useAudioPlayer();

  const { isKhatmahActive, currentProgress, startKhatmah, stopKhatmah, restartKhatmah } = useKhatmah();
  const navigate = useNavigate();

  const { updateReadingHistory } = useBookmarks();
  const lastLoggedVerseRef = useRef<string | null>(null);

  const logVerseReading = useCallback((sId: number, vKey: string) => {
    if (lastLoggedVerseRef.current === vKey) return;
    updateReadingHistory(sId, vKey);
    lastLoggedVerseRef.current = vKey;
  }, [updateReadingHistory]);

  // Audio Interception State (Local UI only)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const translationsByLanguage = getTranslationsByLanguage();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const surahs = await fetchSurahs();
      const currentSurah = surahs.find((s) => s.id === surahId);
      setSurah(currentSurah || null);

      const { verses: versesData } = await fetchVerses(surahId, parseInt(translationId), 1, 300, quranScript);
      setVerses(versesData);

      // Fetch individual verse audios
      const reciterId = getPreferredReciterId();
      const audios = await fetchChapterVerseAudios(surahId, reciterId);
      setVerseAudios(audios);

      setLoading(false);

      // Initial History Log (Surah Started)
      logVerseReading(surahId, `${surahId}:1`);
    };
    loadData();
  }, [surahId, translationId, quranScript, logVerseReading]);

  // Sync Global state to local interactions (Auto-scroll) & Update History
  useEffect(() => {
    if (!loading && currentVerseKey && currentVerseKey.startsWith(`${surahId}:`)) {
      const element = document.getElementById(`verse-${currentVerseKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Log progress on verse change
      logVerseReading(surahId, currentVerseKey);
    }
  }, [currentVerseKey, surahId, logVerseReading, loading]);

  // Prepare playlist data (merge verses with their audio URLs)
  const getVersesWithAudio = () => {
    return verses.map(v => {
      const audioInfo = verseAudios.get(v.verse_key);
      // if (audioInfo) console.log("Has Audio/Segments:", v.verse_key, audioInfo.segments?.length);
      // Manually attach the URL and segments we found to the verse object if missing
      return {
        ...v,
        audio: {
          url: audioInfo?.url || v.audio?.url || "",
          segments: audioInfo?.segments
        }
      };
    });
  };

  // Execute the pending action (user confirmed switch)
  const confirmPlaybackSwitch = () => {
    if (pendingAction) pendingAction();
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const cancelPlaybackSwitch = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // Handlers
  const handleToggleFullPlay = () => {
    if (isPlaying && currentVerseKey?.startsWith(`${surahId}:`)) {
      togglePlay();
      return;
    }

    // Start Playing Surah
    if (surah) {
      // Prepare list with audio urls
      const playlist = getVersesWithAudio();

      // Logic: if something else is playing, confirm?
      if (isPlaying && !currentVerseKey?.startsWith(`${surahId}:`)) {
        setPendingAction(() => () => playSurah(surah, playlist));
        setShowConfirmDialog(true);
      } else {
        playSurah(surah, playlist);
      }
    }
  };

  // Play specific verse
  const handlePlayVerse = (verse: Verse) => {
    const key = verse.verse_key;
    const audioInfo = verseAudios.get(key);
    if (!audioInfo) return; // No audio?

    // Prepare single verse with complete audio url
    const verseWithAudio = {
      ...verse,
      audio: {
        url: audioInfo.url,
        segments: audioInfo.segments
      }
    };

    if (isPlaying && currentVerseKey !== key.toString()) {
      setPendingAction(() => () => {
        if (surah) playVerseGlobal(verseWithAudio, surah);
      });
      setShowConfirmDialog(true);
    } else if (currentVerseKey === key.toString()) {
      togglePlay();
    } else {
      if (surah) playVerseGlobal(verseWithAudio, surah);
    }
  };



  const handlePlayFromVerse = (verseKey: string) => {
    if (!surah) return;
    const playlist = getVersesWithAudio();

    if (isPlaying && !currentVerseKey?.startsWith(`${surahId}:`)) {
      // Playing varying surah -> Confirm
      setPendingAction(() => () => playSurah(surah, playlist, verseKey));
      setShowConfirmDialog(true);
    } else {
      // Playing same surah OR nothing playing -> Just play/jump
      playSurah(surah, playlist, verseKey);
    }
  };

  const handleCopyVerse = (verse: Verse) => {
    const arabicText = verse.text_uthmani;
    const translationText = verse.translations?.[0]?.text.replace(/<[^>]*>/g, "") || "";
    const copyText = `${arabicText}\n\n${translationText}\n[Quran ${surahId}:${verse.verse_number}]`;

    navigator.clipboard.writeText(copyText);
    toast({
      title: "Verse Copied",
      description: `Ayah ${surahId}:${verse.verse_number} copied to clipboard`,
    });
  };

  // Move hook to top level
  const { isExpanded, isHovered } = useSidebar();
  const isSidebarOpen = isExpanded || isHovered;

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
          <Link to="/read">Back to Surahs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-6 py-8 transition-all duration-300",
      !isSidebarOpen ? "max-w-7xl" : "max-w-5xl"
    )}>
      {/* Back Button */}
      <Link
        to="/read"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden md:inline">Back to Surahs</span>
      </Link>

      {/* Surah Header - Minimalist Design */}
      <div className="mb-8 px-4 md:px-0">
        {/* Surah Name - Centered & Big */}
        <div className="text-center mb-6 md:mb-8 pt-2 md:pt-4">
          <h1 className="font-arabic text-3xl md:text-7xl text-foreground mb-1 md:mb-2 leading-tight">
            سورة {surah.name_arabic}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">{surah.name_simple}</p>
        </div>

        {/* Bottom Row: Actions Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border/40 pb-6 relative">

          {/* Left: Translation By */}
          <div className="text-center md:text-left w-full md:w-1/3 order-2 md:order-1">
            <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">Translation by</p>
            <p className="font-medium text-foreground text-sm md:text-lg">
              {Object.values(translationsByLanguage).flat().find(t => t.id.toString() === translationId)?.name || "Sahih International"}
            </p>
          </div>

          {/* Center: Mode Switcher (Segmented Control) */}
          <div className="w-full md:w-1/3 flex justify-center order-1 md:order-2">
            <div className="bg-secondary/50 p-1 rounded-lg inline-flex items-center backdrop-blur-sm border border-border/50 scale-90 md:scale-100 origin-center">
              <button
                onClick={() => setIsReadMode(false)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 md:gap-2",
                  !isReadMode
                    ? "bg-background text-primary shadow-sm ring-1 ring-border/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <AlignRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Translation
              </button>
              <button
                onClick={() => setIsReadMode(true)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 md:gap-2",
                  isReadMode
                    ? "bg-background text-primary shadow-sm ring-1 ring-border/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Reading
              </button>
            </div>
          </div>

          {/* Right: Actions (Info & Play) */}
          <div className="flex flex-col items-center md:items-end gap-1.5 w-full md:w-1/3 order-3 scale-95 md:scale-100 origin-center md:origin-right">
            {/* Top: Surah Info */}
            <Link to={`/info/${surahId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 gap-2 text-[10px] md:text-xs text-muted-foreground/80 hover:text-foreground hover:bg-transparent px-2"
              >
                <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>Surah Info</span>
              </Button>
            </Link>

            {/* Bottom: Story Mode & Play Audio */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {/* Khatmah Buttons Removed from Header as requested */}
              </div>

              <Link to={`/story/${surahId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 gap-2 text-[10px] md:text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 px-2"
                >
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Story Mode</span>
                </Button>
              </Link>

              {verseAudios.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 font-medium hover:bg-transparent px-0 text-[10px] md:text-xs",
                    isPlaying && currentVerseKey?.startsWith(`${surahId}:`) ? "text-primary" : "text-emerald-400 hover:text-emerald-300"
                  )}
                  onClick={handleToggleFullPlay}
                >
                  {isPlaying && currentVerseKey?.startsWith(`${surahId}:`) ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                  <span>{isPlaying && currentVerseKey?.startsWith(`${surahId}:`) ? "Pause Audio" : "Play Audio"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bismillah - Centered with Audio on Click */}
      {surah.id !== 1 && surah.id !== 9 && (
        <div
          className="text-center mb-10 py-8 cursor-pointer group transition-all duration-300 hover:bg-primary/5 rounded-xl"
          onClick={() => {
            const bismillahAudio = new Audio("https://verses.quran.com/Alafasy/mp3/001001.mp3");
            bismillahAudio.play();
          }}
          title="Tap to listen"
        >
          <p className="font-arabic text-2xl md:text-3xl lg:text-4xl text-white leading-relaxed group-hover:text-accent transition-colors duration-300">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {/* Verses Display Logic */}
      {isReadMode ? (
        // MUSHAF MODE: Page-wise View
        <div className="space-y-8">
          {Object.entries(
            verses.reduce((acc, verse) => {
              const page = verse.page_number;
              if (!acc[page]) acc[page] = [];
              acc[page].push(verse);
              return acc;
            }, {} as Record<number, typeof verses>)
          ).map(([pageNumber, pageVerses]) => (
            <div
              key={pageNumber}
              className="max-w-3xl mx-auto py-6 text-center font-arabic text-xl md:text-4xl lg:text-5xl text-foreground relative"
              dir="rtl"
              style={{ lineHeight: '3.5' }}
            >
              <div className="mb-4">
                {pageVerses.map((verse) => {
                  // For Fatiha (Surah 1), only Verse 1 (Bismillah) is a block. Others are inline.
                  const isFatihaBismillah = surahId === 1 && verse.verse_number === 1;
                  const Container = isFatihaBismillah ? "div" : "span";
                  const isCurrentVerse = currentVerseKey === verse.verse_key;

                  const containerClass = cn(
                    isFatihaBismillah ? "relative block mb-8 px-4" : "relative inline-block px-1 rounded-lg transition-colors duration-500",
                    isCurrentVerse && !isFatihaBismillah && "text-primary transition-colors duration-300"
                  );

                  return (
                    <Container key={verse.id} className={containerClass} id={`verse-${surahId}:${verse.verse_number}`}>
                      {verse.words?.filter(word => word.char_type_name !== "end").map((word, wIndex) => (
                        <WordWithMeaning
                          key={word.id}
                          word={word}
                          verseNumber={verse.verse_number}
                          showTooltip={false} // Disable tooltip in Reading mode
                          script={quranScript}
                          className="transition-all duration-200 mx-1 md:mx-1.5"
                          isHighlighted={currentVerseKey === verse.verse_key && (currentWordPosition == word.position || currentWordPosition == word.position - 1)}
                        />
                      ))}
                      {/* Verse End Symbol with Number - Click to Play */}
                      <span
                        className="relative inline-flex items-center justify-center mx-3 align-middle select-none cursor-pointer group/symbol hover:scale-110 transition-transform duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayFromVerse(verse.verse_key);
                        }}
                        title="Play from here"
                      >
                        <span className="text-primary/40 text-4xl group-hover/symbol:text-primary transition-colors duration-200">۝</span>
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.45em] font-bold text-primary mt-1">
                          {verse.verse_number.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)])}
                        </span>
                      </span>
                    </Container>
                  );
                })}
              </div>

              {/* Page Number Footer */}
              <div className="mt-12 pt-6 border-t border-border w-full flex justify-center text-sm font-sans text-muted-foreground select-none">
                Page {pageNumber}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // CARD MODE: Standard View
        <div className="space-y-4">
          {verses.map((verse, index) => {
            const verseKey = verse.verse_key;
            const verseAudioData = verseAudios.get(verseKey);
            const verseAudioUrl = verseAudioData?.url;
            const isVersePlayingNow = currentVerseKey === verseKey && isPlaying;
            const isLoadingThisVerse = isGlobalLoading && currentVerseKey === verseKey;

            return (
              <div
                key={verse.id}
                id={`verse-${surahId}:${verse.verse_number}`}
                className={cn(
                  "glass-card p-4 md:p-6 opacity-0 animate-fade-in group transition-all duration-500",
                  currentVerseKey === verse.verse_key && "border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)] ring-1 ring-primary/20 scale-[1.01]"
                )}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
              >
                {/* Verse Header with Number and Audio */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="min-w-[2.25rem] px-2 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {surahId}:{verse.verse_number}
                    </span>
                    <VerseAudioButton
                      audioUrl={verseAudioUrl || null}
                      isPlaying={isVersePlayingNow}
                      isLoading={isLoadingThisVerse}
                      onPlay={() => handlePlayVerse(verse)}
                      onPause={togglePlay}
                    />
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handlePlayFromVerse(verse.verse_key)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Play from here"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleCopyVerse(verse)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Copy Verse"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {verseKey}
                  </span>
                </div>

                {/* Arabic Text with Word-by-Word Hover */}
                <div
                  className={`w-full mb-4 py-12 text-2xl md:text-5xl ${surahId === 1 && verse.verse_number === 1 ? 'text-center' : 'text-right'}`}
                  dir="rtl"
                  style={{ lineHeight: 2.5 }}
                >
                  {verse.words && verse.words.length > 0 ? (
                    <div className="inline">
                      {verse.words.map((word) => (
                        <WordWithMeaning
                          key={word.id}
                          word={word}
                          verseNumber={verse.verse_number}
                          showTooltip={true}
                          script={quranScript}
                          className="transition-all duration-200 mx-1 md:mx-1.5"
                          isHighlighted={currentVerseKey === verse.verse_key && (currentWordPosition == word.position || currentWordPosition == word.position - 1)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="quran-verse">{verse.text_uthmani}</p>
                  )}
                </div>

                {/* Translation at bottom left */}
                {verse.translations && verse.translations[0] && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-left">
                      {verse.translations[0].text.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* End of Surah */}
      <div className="text-center py-12">
        <p className="text-muted-foreground">End of {surah.name_simple}</p>
        {surahId < 114 && (
          <Button asChild variant="hero" className="mt-4">
            <Link to={`/read/${surahId + 1}`}>
              Next Surah
            </Link>
          </Button>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interrupt current playback?</AlertDialogTitle>
            <AlertDialogDescription>
              Another audio is currently playing. Do you want to stop it and play this instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPlaybackSwitch}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlaybackSwitch}>Play New</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



    </div>
  );
};

// Main Read Quran Page
const ReadQuran = () => {
  const { surahId } = useParams();

  if (surahId) {
    return <SurahReader surahId={parseInt(surahId)} />;
  }

  return <SurahList />;
};

export default ReadQuran;
