"use client";

import React, { useEffect } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    X,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

const FocusMode: React.FC = () => {
    const {
        isPlaying,
        currentVerseKey,
        currentSurah,
        currentVerse,
        currentWordPosition,
        isLoading,
        currentTime,
        duration,
        isFocusMode,
        setFocusMode,
        togglePlay,
        playNext,
        playPrev,
        seek,
        currentIndex,
        playlist,
        playSurah
    } = useAudioPlayer();

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [bgImage, setBgImage] = React.useState<string>("");
    const [imageIndex, setImageIndex] = React.useState<number>(0);

    // Sequence through images on every Ayah change
    useEffect(() => {
        if (isFocusMode && currentVerseKey) {
            // Cycle through focus (2).jpg to focus (21).jpg
            const nextIndex = (imageIndex % 20) + 2;
            setBgImage(`/focus_mod_images/focus (${nextIndex}).jpg`);
            setImageIndex(prev => prev + 1);
        }
    }, [isFocusMode, currentVerseKey]);

    // Prevent body scroll when Focus Mode is active
    useEffect(() => {
        if (isFocusMode) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isFocusMode]);

    // Auto-scroll to active word
    useEffect(() => {
        if (isFocusMode && currentWordPosition !== -1) {
            const activeWord = document.getElementById("active-word-focus");
            if (activeWord) {
                activeWord.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
    }, [isFocusMode, currentWordPosition, currentVerseKey]);

    const handlePlayFull = () => {
        if (currentSurah && playlist.length > 0) {
            playSurah(currentSurah, playlist, playlist[0].verse_key);
        }
    };

    if (!isFocusMode || !currentSurah || !currentVerse) return null;

    const surahProgress = playlist.length > 0 ? ((currentIndex + 1) / playlist.length) * 100 : 0;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[300] bg-background flex flex-col items-center justify-between transition-all duration-500 ease-in-out overflow-hidden",
                isFocusMode ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            {/* Immersive Background Crossfade */}
            {bgImage && (
                <div key={bgImage} className="absolute inset-0 -z-10 animate-fade-in duration-1000">
                    <img
                        src={bgImage}
                        alt=""
                        className="w-full h-full object-cover blur-[10px] scale-110 brightness-[0.6]"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            )}

            {/* Top Bar - Minimal */}
            <div className="w-full px-6 py-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs ring-1 ring-primary/20">
                        {currentSurah.id}
                    </div>
                    <div>
                        <h2 className="font-arabic text-sm text-foreground">
                            سورة {currentSurah.name_arabic}
                        </h2>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-semibold">
                            Ayah {currentVerseKey?.split(":")[1]}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayFull}
                        className="h-7 px-3 text-[10px] uppercase tracking-wider font-bold rounded-full border-primary/20 hover:bg-primary/10 text-primary transition-all"
                    >
                        Play Full
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setFocusMode(false);
                            if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => { });
                            }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content - Centered Stage with Scroll */}
            <div
                ref={scrollContainerRef}
                className="flex-1 w-full overflow-y-auto scrollbar-none px-6"
            >
                <div className="min-h-full flex flex-col items-center py-[20vh] max-w-4xl mx-auto">
                    {/* Surah Progress Indicator */}
                    <div className="w-full max-w-md mb-12 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary/40 transition-all duration-1000 ease-out"
                                style={{ width: `${surahProgress}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                            Surah Progress: Ayah {currentIndex + 1} / {playlist.length}
                        </span>
                    </div>

                    <div className="w-full flex flex-col items-center gap-10 md:gap-16">
                        {/* Arabic Verse */}
                        <div
                            className="font-arabic text-xl md:text-3xl lg:text-4xl text-foreground leading-[2.2] md:leading-[2.5] text-center"
                            dir="rtl"
                        >
                            {currentVerse.words && currentVerse.words.length > 0 ? (
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-6 md:gap-y-10">
                                    {currentVerse.words
                                        .filter(w => w.char_type_name !== "end")
                                        .map((w, i) => {
                                            const isHighlighted = currentWordPosition === w.position;
                                            return (
                                                <span
                                                    key={w.id || i}
                                                    id={isHighlighted ? "active-word-focus" : undefined}
                                                    className={cn(
                                                        "transition-all duration-300 inline-block px-1",
                                                        isHighlighted ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.4)] font-bold" : "opacity-80"
                                                    )}
                                                >
                                                    {w.text_uthmani || (w as any).text || ""}
                                                </span>
                                            );
                                        })}
                                </div>
                            ) : (
                                <p className="opacity-95">{currentVerse.text_uthmani}</p>
                            )}
                        </div>

                        {/* Translation */}
                        {currentVerse.translations?.[0] && (
                            <div className="max-w-2xl mx-auto border-t border-primary/5 pt-8 animate-fade-in">
                                <p className="text-sm md:text-base lg:text-lg text-muted-foreground/60 font-medium leading-relaxed italic text-center">
                                    "{currentVerse.translations[0].text.replace(/<[^>]*>/g, "")}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar - Minimal Player */}
            <div className="w-full max-w-2xl px-6 pb-10 flex flex-col items-center gap-6">
                {/* Progress Bar */}
                <div className="w-full scale-90 md:scale-100">
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={seek}
                    />
                </div>

                {/* Compact Controls */}
                <div className="flex items-center gap-8 md:gap-12">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={playPrev}
                        className="h-10 w-10 text-muted-foreground/50 hover:text-foreground transition-all active:scale-95"
                    >
                        <SkipBack className="w-5 h-5" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={togglePlay}
                        className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/90 text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-8 h-8 fill-current" />
                        ) : (
                            <Play className="w-8 h-8 fill-current ml-1" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => playNext()}
                        className="h-10 w-10 text-muted-foreground/50 hover:text-foreground transition-all active:scale-95"
                    >
                        <SkipForward className="w-5 h-5" />
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="mt-2 text-[9px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
                >
                    {isPlaying ? "Reading in Progress..." : "Continue Reading"}
                </Button>
            </div>
        </div>
    );
};

export default FocusMode;
