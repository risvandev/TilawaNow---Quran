import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Pause,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import {
  fetchSurahs,
  fetchVerses,
  fetchChapterAudio,
  Surah,
  Verse,
  QURAN_STATS,
} from "@/lib/quran-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Read Quran</h1>
        <p className="text-muted-foreground">
          {QURAN_STATS.totalSurahs} Surahs • {QURAN_STATS.totalAyahs.toLocaleString()} Ayahs
        </p>
      </div>

      {/* Search */}
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

      {/* Surah Grid */}
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

// Surah Reader View
const SurahReader = ({ surahId }: { surahId: number }) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [translationId, setTranslationId] = useState("131"); // Sahih International

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

      setLoading(false);
    };
    loadData();
  }, [surahId, translationId]);

  useEffect(() => {
    if (audioUrl) {
      const newAudio = new Audio(audioUrl);
      newAudio.addEventListener("ended", () => setIsPlaying(false));
      setAudio(newAudio);
      return () => {
        newAudio.pause();
        newAudio.removeEventListener("ended", () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

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
    <div className="container mx-auto px-6 py-8">
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

        {/* Audio Controls */}
        <div className="flex items-center justify-center gap-4">
          {audioUrl && (
            <Button
              variant="hero"
              size="icon"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
          )}
          <Select value={translationId} onValueChange={setTranslationId}>
            <SelectTrigger className="w-48 bg-secondary border-border">
              <SelectValue placeholder="Select translation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="131">Sahih International</SelectItem>
              <SelectItem value="20">Saheeh International</SelectItem>
              <SelectItem value="85">Abdul Haleem</SelectItem>
              <SelectItem value="203">Mustafa Khattab</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bismillah */}
      {surah.id !== 1 && surah.id !== 9 && (
        <div className="text-center mb-8">
          <p className="quran-verse-large text-accent">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        </div>
      )}

      {/* Verses */}
      <div className="space-y-6">
        {verses.map((verse, index) => (
          <div
            key={verse.id}
            className="glass-card p-6 opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {verse.verse_number}
              </span>
              <p className="quran-verse flex-1 text-right">{verse.text_uthmani}</p>
            </div>
            {verse.translations && verse.translations[0] && (
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed border-t border-border pt-4">
                {verse.translations[0].text.replace(/<[^>]*>/g, "")}
              </p>
            )}
          </div>
        ))}
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
