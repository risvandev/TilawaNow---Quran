"use client";

import { useRouter } from "next/navigation";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import {
    Play, Pause, SkipForward, SkipBack, X,
    Loader2, Repeat, Repeat1, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProgressBar from "@/components/player/ProgressBar";
import FullPlayer from "@/components/player/FullPlayer";

const GlobalAudioPlayer = () => {
    const navigate = useRouter();
    const {
        currentVerseKey,
        currentSurah,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        isPlayerVisible,
        togglePlay,
        playNext,
        playPrev,
        closePlayer,
        seek,
        setFullPlayerOpen,
        playbackRate,
        setPlaybackRate,
        loopMode,
        setLoopMode
    } = useAudioPlayer();

    if (!isPlayerVisible) return <FullPlayer />;

    return (
        <>
            {/* Mini Player */}
            <div className="fixed bottom-[68px] md:bottom-4 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[101] animate-in slide-in-from-bottom-full duration-500 md:w-full md:max-w-2xl">
                <div className="player-glass rounded-2xl shadow-2xl ring-1 ring-white/[0.06] overflow-hidden">
                    
                    {/* Top Progress Bar (thin accent line) */}
                    <div className="px-3 pt-2">
                        <ProgressBar
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={seek}
                            compact
                        />
                    </div>

                    {/* Main Controls Row */}
                    <div className="px-3 pb-3 pt-1.5 flex items-center justify-between gap-2 md:gap-4">
                        
                        {/* Track Info — Click to Open Full Player */}
                        <div
                            className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1 cursor-pointer group"
                            onClick={() => setFullPlayerOpen(true)}
                        >
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 text-xs md:text-sm ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-all duration-200 shadow-sm">
                                {currentSurah!.id}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-xs md:text-sm truncate leading-tight group-hover:text-primary transition-colors">
                                    {currentSurah!.name_simple}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] md:text-xs text-muted-foreground truncate">
                                        Verse {currentVerseKey!.split(':')[1]}
                                    </span>
                                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30 hidden md:block" />
                                    <span className="text-[10px] md:text-xs text-muted-foreground hidden md:block truncate">
                                        {currentSurah!.translated_name.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Transport Controls */}
                        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={playPrev}
                                className="h-8 w-8 md:h-9 md:w-9 text-foreground/70 hover:text-foreground rounded-lg"
                            >
                                <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Button>

                            <Button
                                size="icon"
                                className="h-10 w-10 md:h-11 md:w-11 rounded-full shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
                                onClick={togglePlay}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4.5 h-4.5 md:w-5 md:h-5 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-4.5 h-4.5 md:w-5 md:h-5 fill-current" />
                                ) : (
                                    <Play className="w-4.5 h-4.5 md:w-5 md:h-5 fill-current ml-0.5" />
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => playNext()}
                                className="h-8 w-8 md:h-9 md:w-9 text-foreground/70 hover:text-foreground rounded-lg"
                            >
                                <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Button>
                        </div>

                        {/* Secondary Controls */}
                        <div className="flex items-center gap-0.5 md:gap-1 shrink-0 border-l border-border/30 pl-2 md:pl-3 ml-1">
                            
                            {/* Loop Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (loopMode === 'NONE') setLoopMode('SURAH');
                                    else if (loopMode === 'SURAH') setLoopMode('AYAH');
                                    else setLoopMode('NONE');
                                }}
                                className={cn(
                                    "transition-colors h-8 w-8 rounded-lg",
                                    loopMode !== 'NONE' ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                                )}
                                title={loopMode === 'AYAH' ? "Looping current Ayah" : loopMode === 'SURAH' ? "Looping Surah" : "Loop off"}
                            >
                                {loopMode === 'AYAH' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                            </Button>

                            {/* Speed Control — hidden on mobile */}
                            <div className="hidden md:block">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-1.5 gap-1 rounded-lg text-muted-foreground hover:text-foreground font-medium flex items-center"
                                        >
                                            <Gauge className="w-3.5 h-3.5" />
                                            <span className="text-[10px]">{playbackRate}x</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="center" sideOffset={12} className="w-24 min-w-[5rem]">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                            <DropdownMenuItem
                                                key={rate}
                                                onClick={() => setPlaybackRate(rate)}
                                                className={cn("justify-center", playbackRate === rate && "bg-primary/10 text-primary font-bold")}
                                            >
                                                {rate}x
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>


                            {/* Close */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closePlayer}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Player Drawer */}
            <FullPlayer />
        </>
    );
};

export default GlobalAudioPlayer;
