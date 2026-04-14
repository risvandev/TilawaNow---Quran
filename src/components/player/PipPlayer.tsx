"use client";

import React from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import {
    Play, Pause, SkipForward, SkipBack, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

const PipPlayer: React.FC = () => {
    const {
        isPlaying,
        currentVerseKey,
        currentSurah,
        currentVerse,
        currentWordPosition,
        isLoading,
        currentTime,
        duration,
        togglePlay,
        playNext,
        playPrev,
        seek
    } = useAudioPlayer();

    if (!currentVerseKey || !currentSurah) return null;

    return (
        <div className="flex flex-col h-screen w-screen p-4 bg-background/95 backdrop-blur-xl select-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 ring-1 ring-primary/20">
                    {currentSurah.id}
                </div>
                <div className="min-w-0">
                    <h2 className="font-arabic text-lg text-foreground truncate">
                        {currentSurah.name_arabic}
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        Verse {currentVerseKey.split(":")[1]}
                    </p>
                </div>
            </div>

            {/* Ayah Display */}
            <div className="flex-1 flex flex-col justify-center min-h-0 mb-4 px-2">
                <div className="text-center overflow-y-auto max-h-full scrollbar-none" dir="rtl">
                    {currentVerse?.words && currentVerse.words.length > 0 ? (
                        <p className="font-arabic text-xl md:text-2xl text-foreground leading-[2]">
                            {currentVerse.words
                                .filter(w => w.char_type_name !== "end")
                                .map((w, i) => {
                                    const text = w.text_uthmani || (w as any).text || "";
                                    const isHighlighted = currentWordPosition === w.position;
                                    return (
                                        <span
                                            key={w.id || i}
                                            className={cn(
                                                "inline-block mx-0.5 transition-all duration-200",
                                                isHighlighted && "word-highlight"
                                            )}
                                        >
                                            {text}
                                        </span>
                                    );
                                })}
                        </p>
                    ) : (
                        <p className="font-arabic text-xl md:text-2xl text-foreground leading-[2]">
                            {currentVerse?.text_uthmani || ""}
                        </p>
                    )}
                </div>
                
                {/* Simplified Translation */}
                {currentVerse?.translations?.[0] && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2 italic truncate px-4">
                        {currentVerse.translations[0].text.replace(/<[^>]*>/g, "")}
                    </p>
                )}
            </div>

            {/* Progress */}
            <div className="mb-4 px-2">
                <ProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={seek}
                    compact
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={playPrev}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
                >
                    <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
                    onClick={togglePlay}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playNext()}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
                >
                    <SkipForward className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default PipPlayer;
