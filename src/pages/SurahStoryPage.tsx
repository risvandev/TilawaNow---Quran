
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchSurah, fetchVerses, Surah, Verse } from "@/lib/quran-api";
import { chatWithAI } from "@/lib/ai-service";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const GROUP_SIZE = 5;

const SurahStoryPage = () => {
    const { surahId } = useParams();
    const [surah, setSurah] = useState<Surah | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [story, setStory] = useState<string>("");

    // Loading states
    const [loadingSurah, setLoadingSurah] = useState(true);
    const [generatingStory, setGeneratingStory] = useState(false);

    // Persist translation settings
    const translationId = parseInt(localStorage.getItem("quranTranslation") || "131");
    const script = localStorage.getItem("quranScript") || "text_uthmani";

    // 1. Initial Load: Surah & Verses
    useEffect(() => {
        const loadInitialData = async () => {
            if (!surahId) return;
            setLoadingSurah(true);
            try {
                const sId = parseInt(surahId);
                const [surahData, versesData] = await Promise.all([
                    fetchSurah(sId),
                    fetchVerses(sId, translationId, 1, 300, script)
                ]);
                setSurah(surahData);
                setVerses(versesData.verses);
            } catch (error) {
                console.error("Failed to load surah", error);
            } finally {
                setLoadingSurah(false);
            }
        };
        loadInitialData();
    }, [surahId, translationId, script]);

    // 2. Load Story for Current Group
    useEffect(() => {
        if (verses.length === 0) return;
        loadStoryForGroup(currentGroupIndex);
    }, [currentGroupIndex, verses]);

    const getGroupVerses = (groupIndex: number) => {
        const start = groupIndex * GROUP_SIZE;
        return verses.slice(start, start + GROUP_SIZE);
    };

    const getCacheKey = (sId: string, groupIndex: number) => `story_group_${translationId}_${sId}_${groupIndex}`;

    const loadStoryForGroup = async (groupIndex: number) => {
        if (!surahId) return;

        const groupVerses = getGroupVerses(groupIndex);
        if (groupVerses.length === 0) return;

        const cacheKey = getCacheKey(surahId, groupIndex);
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
            setStory(cached);
            prefetchNext(groupIndex + 1);
            return;
        }

        setGeneratingStory(true);
        setStory("");

        try {
            // Combine translations
            const combinedText = groupVerses.map(v => v.translations?.[0]?.text.replace(/<[^>]*>/g, "")).join(" ");
            const verseRange = `${groupVerses[0].verse_key} - ${groupVerses[groupVerses.length - 1].verse_key}`;
            const language = localStorage.getItem("selectedTranslationName") || "English";

            const generated = await generateStoriesAI(combinedText, verseRange, language);

            if (generated) {
                sessionStorage.setItem(cacheKey, generated);
                setStory(generated);
                prefetchNext(groupIndex + 1);
            }
        } catch (error) {
            console.error("Generation error", error);
            setStory("Could not generate story. Please try refreshing.");
        } finally {
            setGeneratingStory(false);
        }
    };

    const prefetchNext = async (nextGroupIndex: number) => {
        if (!surahId) return;
        const nextVerses = getGroupVerses(nextGroupIndex);
        if (nextVerses.length === 0) return;

        const cacheKey = getCacheKey(surahId, nextGroupIndex);
        if (sessionStorage.getItem(cacheKey)) return;

        console.log(`Prefetching Chunk ${nextGroupIndex}...`);
        try {
            const combinedText = nextVerses.map(v => v.translations?.[0]?.text.replace(/<[^>]*>/g, "")).join(" ");
            const verseRange = `${nextVerses[0].verse_key} - ${nextVerses[nextVerses.length - 1].verse_key}`;
            const language = localStorage.getItem("selectedTranslationName") || "English";

            const generated = await generateStoriesAI(combinedText, verseRange, language);
            if (generated) {
                sessionStorage.setItem(cacheKey, generated);
            }
        } catch (e) {
            console.warn("Prefetch failed", e);
        }
    };

    const generateStoriesAI = async (text: string, range: string, language: string = "English"): Promise<string> => {
        const systemPrompt = `You are a storyteller.
        Rewrite this block of Quran Verses (${range}) meaning as a single, simple continuous story paragraph.
        
        Base Text: "${text}"
        
        Task:
        1. Read the Base Text details carefully.
        2. Write a single paragraph story based on it.
        3. STRICTLY OUTPUT IN THIS LANGUAGE: ${language}.

        Rules:
        - Use VERY SIMPLE everyday words.
        - Do NOT mention "Verse numbers".
        - Continuous narrative flow.
        - Length: 1 paragraph (3-5 sentences).
        `;

        try {
            return await chatWithAI([{ role: "system", content: systemPrompt }]);
        } catch (e) {
            throw e;
        }
    };

    const handleNext = () => {
        if ((currentGroupIndex + 1) * GROUP_SIZE < verses.length) {
            setCurrentGroupIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentGroupIndex > 0) {
            setCurrentGroupIndex(prev => prev - 1);
        }
    };

    if (loadingSurah) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!surah || verses.length === 0) return <div>Surah not found.</div>;

    const currentGroupVerses = getGroupVerses(currentGroupIndex);
    const startVerseNum = currentGroupVerses[0]?.verse_number;
    const endVerseNum = currentGroupVerses[currentGroupVerses.length - 1]?.verse_number;

    return (
        <div className="min-h-screen bg-background text-foreground font-serif selection:bg-primary/20 flex flex-col items-center p-2 md:p-6 transition-colors duration-500">
            {/* Header */}
            <div className="max-w-3xl w-full flex items-center justify-between mb-8">
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground px-2 md:px-4">
                    <Link to={`/read/${surahId}`}>
                        <ChevronLeft className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Back to Quran</span>
                    </Link>
                </Button>
                <div className="text-right md:text-center">
                    <h1 className="text-lg md:text-xl font-bold">{surah.name_simple}</h1>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Story Mode • Verses {startVerseNum}-{endVerseNum}</p>
                </div>
                <div className="w-8 md:w-24" />
            </div>

            {/* Story Card */}
            <div className="max-w-3xl w-full flex-1 flex flex-col justify-center min-h-[60vh]">
                <div className="relative bg-card/40 border border-border/60 rounded-[2rem] p-4 md:p-12 shadow-2xl overflow-hidden group hover:border-primary/20 transition-all duration-500">

                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col gap-8 text-center transition-all duration-300">
                        {/* Story Text */}
                        <div className="min-h-[200px] flex items-center justify-center">
                            {generatingStory ? (
                                <div className="space-y-3 w-full animate-pulse opacity-70">
                                    <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                                    <div className="h-4 bg-muted rounded w-5/6 mx-auto" />
                                    <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                                </div>
                            ) : (
                                <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed mx-auto font-medium text-foreground/90 animate-fade-in bg-background/50 p-4 md:p-6 rounded-xl border border-border/10 shadow-sm w-full">
                                    <Sparkles className="w-5 h-5 text-amber-500 inline-block mr-2 mb-1" />
                                    {story}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-xl w-full mt-12 grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePrev}
                    disabled={currentGroupIndex === 0}
                    className="group"
                >
                    <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Previous
                </Button>
                <Button
                    variant="hero"
                    size="lg"
                    onClick={handleNext}
                    disabled={(currentGroupIndex + 1) * GROUP_SIZE >= verses.length}
                    className="group shadow-lg shadow-primary/20"
                >
                    Next Part
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            <div className="mt-8 text-xs text-muted-foreground">
                Part {currentGroupIndex + 1} / {Math.ceil(verses.length / GROUP_SIZE)}
            </div>

        </div>
    );
};

export default SurahStoryPage;
