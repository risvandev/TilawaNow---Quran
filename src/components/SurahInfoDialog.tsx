
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Info, History, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { Surah, fetchSurahInfo } from "@/lib/quran-api";
import { chatWithAI } from "@/lib/ai-service";

interface SurahInfoDialogProps {
    surah: Surah | null;
    isOpen: boolean;
    onClose: () => void;
}

interface StructuredInfo {
    snapshot: string;
    context: string;
    tafsir: string;
}

export const SurahInfoDialog = ({ surah, isOpen, onClose }: SurahInfoDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState<StructuredInfo | null>(null);

    useEffect(() => {
        if (isOpen && surah) {
            loadInfo();
        }
    }, [isOpen, surah]);

    const loadInfo = async () => {
        if (!surah) return;
        setLoading(true);
        setInfo(null);

        try {
            // 1. Fetch raw info from Quran.com to respect "take information from quran.com"
            const rawData = await fetchSurahInfo(surah.id);
            const rawText = rawData?.text || "";

            // 2. Use AI to structure it perfectly
            // 2. Use AI to structure it perfectly
            const systemPrompt = `You are a Quran scholar.
        The user wants information about Surah ${surah.name_simple} (${surah.name_arabic}).
        
        Source Text from Quran.com (use this as primary source if useful):
        "${rawText.substring(0, 1000)}..."

        Task: Return a JSON object with exactly these 3 fields:
        1. "snapshot": A quick identity card (Location, Classification, Placement). No interpretation. One line.
        2. "context": Revelation Context (Asbāb al-Nuzūl). The incident/reason. One line.
        3. "tafsir": Tafsir Insight. Scholarly explanation of the main theme. One line.

        Format:
        {
          "snapshot": "...",
          "context": "...",
          "tafsir": "..."
        }
        Do NOT return markdown. Return ONLY the JSON.`;

            let response;
            try {
                response = await chatWithAI(
                    [{ role: "system", content: systemPrompt }]
                );
            } catch (e) {
                // If AI fails/no keys, fallback logic will trigger in following block or by throwing
                // Actually easier to just catch here or let it fall through
            }

            if (response) {
                // Parse JSON
                try {
                    // Clean possible markdown code blocks
                    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleaned);
                    setInfo({
                        snapshot: parsed.snapshot || "Information not available.",
                        context: parsed.context || "Context not available.",
                        tafsir: parsed.tafsir || "Insight not available."
                    });
                } catch (e) {
                    console.error("Failed to parse AI response", e);
                    // Fallback if AI JSON fails
                    setInfo({
                        snapshot: `${surah.revelation_place} Surah, ${surah.verses_count} Verses.`,
                        context: "Historical context details could not be loaded.",
                        tafsir: rawText.substring(0, 150) + "..."
                    });
                }
            } else {
                // Fallback if no AI response
                setInfo({
                    snapshot: `${surah.revelation_place} Surah, Order #${surah.revelation_order}`,
                    context: "Context API require AI key.",
                    tafsir: rawData?.short_text || rawText.substring(0, 200) || "No info available."
                });
            }

        } catch (error) {
            console.error("Error loading info:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!surah) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader className="p-6 pb-4 border-b border-border/10 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="font-bold text-primary">{surah.id}</span>
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {surah.name_simple} <span className="font-arabic font-normal text-muted-foreground">{surah.name_arabic}</span>
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80">
                                {surah.translated_name.name} • {surah.verses_count} Ayahs
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse">Consulting scholars...</p>
                        </div>
                    ) : info ? (
                        <div className="space-y-6">
                            {/* 1. Snapshot */}
                            <div className="group rounded-2xl border border-border/40 bg-card/50 p-5 hover:bg-card/80 transition-colors">
                                <div className="flex items-center gap-3 mb-3 text-blue-500">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Snapshot</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12 border-l-2 border-blue-500/20">
                                    {info.snapshot}
                                </p>
                            </div>

                            {/* 2. Revelation Context */}
                            <div className="group rounded-2xl border border-border/40 bg-card/50 p-5 hover:bg-card/80 transition-colors">
                                <div className="flex items-center gap-3 mb-3 text-amber-500">
                                    <div className="p-2 rounded-lg bg-amber-500/10">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Revelation Context</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12 border-l-2 border-amber-500/20">
                                    {info.context}
                                </p>
                            </div>

                            {/* 3. Tafsir Insight */}
                            <div className="group rounded-2xl border border-border/40 bg-card/50 p-5 hover:bg-card/80 transition-colors">
                                <div className="flex items-center gap-3 mb-3 text-purple-500">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">Tafsir Insight</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12 border-l-2 border-purple-500/20">
                                    {info.tafsir}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Could not load information.
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t border-border/10 bg-secondary/20 flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
