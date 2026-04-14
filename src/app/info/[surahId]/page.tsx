"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchSurah, fetchSurahInfo, Surah } from "@/lib/quran-api";
import { chatWithAI } from "@/lib/ai-service";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StructuredInfo {
    snapshot: string;
    context: string;
    tafsir: string;
}

const SurahInfoPage = () => {
    const { surahId } = useParams();
    const [surah, setSurah] = useState<Surah | null>(null);
    const [info, setInfo] = useState<StructuredInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!surahId) return;
            setLoading(true);

            try {
                const id = parseInt(surahId);
                const surahData = await fetchSurah(id);
                setSurah(surahData);

                if (surahData) {
                    // 1. Fetch raw info
                    const rawData = await fetchSurahInfo(id);
                    const rawText = rawData?.text || "";

                    // 2. AI Structure
                    const systemPrompt = `You are a Quran scholar.
            The user wants information about Surah ${surahData.name_simple} (${surahData.name_arabic}).
            
            Source Text from Quran.com (STRICTLY USE THIS SOURCE ONLY):
            "${rawText}"

            Task: Extract and summarize information from the Source Text into these 3 fields. 
            - Do NOT hallucinate info not present in the source.
            - If the source is missing specific details for a section, state "Details not available in source."
            - Keep language simple, clear, and easy to read (Wikipedia style).

            Fields:
            1. "snapshot": Identity card (Location, Classification, Placement). Max 2 sentences.
            2. "context": Revelation Context (Asbāb al-Nuzūl). What led to its revelation? 3-4 sentences allowed.
            3. "tafsir": Tafsir Insight. Core themes and lessons. 3-4 sentences allowed.

            Format:
            { "snapshot": "...", "context": "...", "tafsir": "..." }
            Return ONLY the JSON.`;

                    try {
                        const response = await chatWithAI([{ role: "system", content: systemPrompt }]);
                        const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
                        setInfo(JSON.parse(cleaned));
                    } catch (e) {
                        // Fallback
                        setInfo({
                            snapshot: `${surahData.revelation_place} Surah, ${surahData.verses_count} Verses.`,
                            context: "Context details unavailable.",
                            tafsir: rawText.substring(0, 200) + "..."
                        });
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [surahId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
        );
    }

    if (!surah || !info) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-serif selection:bg-primary/20">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Back Navigation */}
                <Link href={`/read/${surahId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm no-underline transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Surah
                </Link>

                {/* Header - Minimal */}
                <header className="mb-12 border-b border-border/40 pb-6">
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">{surah.name_simple}</h1>
                    <div className="flex items-center gap-3 text-muted-foreground text-lg">
                        <span className="font-arabic">{surah.name_arabic}</span>
                        <span>•</span>
                        <span>{surah.translated_name.name}</span>
                    </div>
                </header>

                {/* Content - Wikipedia Style (Clean, Readable) */}
                <div className="space-y-12 leading-relaxed text-lg">

                    <section>
                        <h2 className="text-xl font-bold mb-3 border-b border-border/20 pb-1">Snapshot</h2>
                        <p className="text-foreground/90">{info.snapshot}</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 border-b border-border/20 pb-1">Revelation Context</h2>
                        <p className="text-foreground/90">{info.context}</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 border-b border-border/20 pb-1">Tafsir Insight</h2>
                        <p className="text-foreground/90">{info.tafsir}</p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default SurahInfoPage;
