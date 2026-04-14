"use client";

import React, { useRef, useEffect } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Play, Volume2 } from "lucide-react";

const PlayerQueue: React.FC = () => {
    const { playlist, currentIndex, jumpToIndex, currentVerseKey, isPlaying } = useAudioPlayer();
    const activeRef = useRef<HTMLButtonElement>(null);

    // Auto-scroll to current verse
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentIndex]);

    if (playlist.length === 0) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Queue
                </h3>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {currentIndex + 1} / {playlist.length}
                </span>
            </div>
            <ScrollArea className="flex-1 max-h-[260px]">
                <div className="p-1.5">
                    {playlist.map((verse, index) => {
                        const isCurrent = index === currentIndex;
                        const isPast = index < currentIndex;
                        const verseNum = verse.verse_key.split(":")[1];
                        
                        return (
                            <button
                                key={verse.verse_key}
                                ref={isCurrent ? activeRef : undefined}
                                onClick={() => jumpToIndex(index)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                                    "hover:bg-primary/5 active:scale-[0.98]",
                                    isCurrent && "bg-primary/10 ring-1 ring-primary/20",
                                    isPast && "opacity-50"
                                )}
                            >
                                <div className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                                    isCurrent 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "bg-secondary/60 text-muted-foreground"
                                )}>
                                    {isCurrent && isPlaying ? (
                                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                                    ) : (
                                        verseNum
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={cn(
                                        "text-sm truncate font-arabic leading-relaxed",
                                        isCurrent ? "text-primary font-semibold" : "text-foreground/80"
                                    )} dir="rtl">
                                        {verse.text_uthmani?.slice(0, 60)}{(verse.text_uthmani?.length || 0) > 60 ? "..." : ""}
                                    </p>
                                    {verse.translations?.[0] && (
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                            {verse.translations[0].text.replace(/<[^>]*>/g, "").slice(0, 50)}...
                                        </p>
                                    )}
                                </div>
                                {!isCurrent && (
                                    <Play className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};

export default React.memo(PlayerQueue);
