import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
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

// Word component with hover tooltip for meaning
const WordWithMeaning = ({ word }: { word: Word }) => {
  // Get Arabic text - prefer text_uthmani, fallback to text
  const arabicText = word.text_uthmani || (word as any).text || "";
  
  if (word.char_type_name === "end") {
    return (
      <span className="font-arabic text-accent/60 mx-1 text-xl">
        {arabicText}
      </span>
    );
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span className="font-arabic text-accent hover:text-primary hover:bg-primary/10 rounded px-1.5 py-1 cursor-help transition-all duration-200 inline-block text-2xl leading-relaxed">
          {arabicText}
        </span>
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

// Surah List View
const SurahList = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      setSurahs(data);
      setLoading(false);
    };
    loadSurahs();
  }, []);

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.name_arabic.includes(searchQuery) ||
      surah.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Read Quran</h1>
        <p className="text-muted-foreground">
          {QURAN_STATS.totalSurahs} Surahs • {QURAN_STATS.totalAyahs.toLocaleString()} Ayahs
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search surahs by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid gap-3">
        {filteredSurahs.map((surah, index) => (
          <Link
            key={surah.id}
            to={`/read/${surah.id}`}
            className="surah-card flex items-center gap-4 opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
          >
            <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
              {surah.id}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{surah.name_simple}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                  {surah.revelation_place}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {surah.translated_name.name} • {surah.verses_count} verses
              </p>
            </div>
            <p className="font-arabic text-xl text-accent shrink-0">{surah.name_arabic}</p>
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
  const [surah, setSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [verseAudios, setVerseAudios] = useState<Map<string, string>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const [translationId, setTranslationId] = useState("131");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseAudioRef = useRef<HTMLAudioElement | null>(null);

  const translationsByLanguage = getTranslationsByLanguage();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const surahs = await fetchSurahs();
      const currentSurah = surahs.find((s) => s.id === surahId);
      setSurah(currentSurah || null);

      const { verses: versesData } = await fetchVerses(surahId, parseInt(translationId), 1, 300);
      setVerses(versesData);

      const audioData = await fetchChapterAudio(surahId);
      setAudioUrl(audioData);

      // Fetch individual verse audios
      const verseAudioData = await fetchChapterVerseAudios(surahId);
      setVerseAudios(verseAudioData);

      setLoading(false);
    };
    loadData();
  }, [surahId, translationId]);

  // Full surah audio
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  const toggleFullPlay = useCallback(() => {
    if (!audioRef.current) return;
    
    // Stop verse audio if playing
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      setPlayingVerseKey(null);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Play specific verse
  const playVerse = useCallback((verseKey: string) => {
    const url = verseAudios.get(verseKey);
    if (!url) return;

    setLoadingAudio(verseKey);

    // Stop full surah audio if playing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // Stop previous verse if playing
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
    }

    verseAudioRef.current = new Audio(url);
    verseAudioRef.current.addEventListener("canplaythrough", () => {
      setLoadingAudio(null);
      verseAudioRef.current?.play();
      setPlayingVerseKey(verseKey);
    });
    verseAudioRef.current.addEventListener("ended", () => {
      setPlayingVerseKey(null);
    });
    verseAudioRef.current.addEventListener("error", () => {
      setLoadingAudio(null);
      setPlayingVerseKey(null);
    });
    verseAudioRef.current.load();
  }, [verseAudios, isPlaying]);

  const pauseVerse = useCallback(() => {
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      setPlayingVerseKey(null);
    }
  }, []);

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
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      {/* Back Button */}
      <Link
        to="/read"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Surahs
      </Link>

      {/* Surah Header */}
      <div className="glass-card p-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">{surah.name_simple}</h1>
        <p className="font-arabic text-3xl text-accent mb-2">{surah.name_arabic}</p>
        <p className="text-muted-foreground mb-4">
          {surah.translated_name.name} • {surah.verses_count} verses • {surah.revelation_place}
        </p>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {audioUrl && (
            <Button
              variant="hero"
              onClick={toggleFullPlay}
              className="gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause Full Surah" : "Play Full Surah"}
            </Button>
          )}
          
          <Select value={translationId} onValueChange={setTranslationId}>
            <SelectTrigger className="w-64 bg-secondary border-border">
              <SelectValue placeholder="Select translation" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {Object.entries(translationsByLanguage).map(([language, translations]) => (
                <SelectGroup key={language}>
                  <SelectLabel className="text-primary font-semibold">{language}</SelectLabel>
                  {translations.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          💡 Hover over any Arabic word to see its meaning
        </p>
      </div>

      {/* Bismillah */}
      {surah.id !== 1 && surah.id !== 9 && (
        <div className="text-center mb-8">
          <p className="quran-verse-large text-accent">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-sm text-muted-foreground mt-2">
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>
      )}

      {/* Verses */}
      <div className="space-y-4">
        {verses.map((verse, index) => {
          const verseKey = `${surahId}:${verse.verse_number}`;
          const verseAudioUrl = verseAudios.get(verseKey);
          const isVersePlayingNow = playingVerseKey === verseKey;
          const isLoadingThisVerse = loadingAudio === verseKey;

          return (
            <div
              key={verse.id}
              className="glass-card p-5 opacity-0 animate-fade-in group"
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: "forwards" }}
            >
              {/* Verse Header with Number and Audio */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {verse.verse_number}
                  </span>
                  <VerseAudioButton
                    audioUrl={verseAudioUrl || null}
                    isPlaying={isVersePlayingNow}
                    isLoading={isLoadingThisVerse}
                    onPlay={() => playVerse(verseKey)}
                    onPause={pauseVerse}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {verseKey}
                </span>
              </div>

              {/* Arabic Text with Word-by-Word Hover */}
              <div className="text-right mb-4 leading-loose">
                {verse.words && verse.words.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-x-1 gap-y-2" dir="rtl">
                    {verse.words.map((word) => (
                      <WordWithMeaning key={word.id} word={word} />
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
