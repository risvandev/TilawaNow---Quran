"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";


import {
    Play, Pause, SkipForward, SkipBack, X,
    Loader2, Repeat, Repeat1, Gauge, PictureInPicture2,
    Maximize2, Volume2, Volume1, VolumeX, MoreVertical
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import ProgressBar from "@/components/player/ProgressBar";
import FullPlayer from "@/components/player/FullPlayer";
import { usePipPlayer } from "@/hooks/usePipPlayer";

const GlobalAudioPlayer = () => {
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
        isFullPlayerOpen,
        playbackRate,

        setPlaybackRate,
        loopMode,
        setLoopMode,
        volume,
        setVolume,
        isFocusMode,
        setFocusMode
    } = useAudioPlayer();
    const [isSpeedOpen, setIsSpeedOpen] = useState(false);
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const hiddenPaths = ["/", "/contact", "/help", "/about", "/settings", "/ai", "/login", "/signup"];

    const isHidden = hiddenPaths.includes(pathname);
    const isAuthPath = ["/login", "/signup"].includes(pathname);

    // Auto-pause audio when entering login or signup pages
    useEffect(() => {
        if (isAuthPath && isPlaying) {
            togglePlay();
        }
    }, [isAuthPath, isPlaying, togglePlay]);


    const { openPip, closePip, isPipOpen } = usePipPlayer();

    if (isHidden || isFullPlayerOpen) {
        return (
            <>
                <FullPlayer />
            </>
        );
    }
    
    if (!isPlayerVisible) return <FullPlayer />;



    return (
        <>
            {/* Mini Player */}
            <div className="fixed bottom-[68px] md:bottom-4 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[101] animate-in slide-in-from-bottom-full duration-500 md:w-full md:max-w-2xl">
                <div className="player-glass rounded-2xl shadow-2xl ring-1 ring-white/[0.06]">
                    
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
                        
                        {/* Track Info — Click to go to Surah page */}
                        <div
                            className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1 cursor-pointer group"
                            onClick={() => {
                                if (pathname === `/read/${currentSurah!.id}`) {
                                    window.dispatchEvent(new CustomEvent('scroll-to-ayah', { 
                                        detail: { verseKey: currentVerseKey } 
                                    }));
                                } else {
                                    const url = `/read/${currentSurah!.id}#verse-${currentVerseKey}`;
                                    router.push(url);
                                }
                            }}
                        >
                            <div className="flex w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary/10 items-center justify-center font-bold text-primary shrink-0 text-xs md:text-sm ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-all duration-200 shadow-sm">
                                {currentSurah!.id}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-[11px] md:text-sm truncate leading-tight group-hover:text-primary transition-colors">
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
                            
                            {/* Loop Toggle — Desktop */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (loopMode === 'NONE') setLoopMode('SURAH');
                                    else if (loopMode === 'SURAH') setLoopMode('AYAH');
                                    else setLoopMode('NONE');
                                }}
                                className={cn(
                                    "transition-colors h-8 w-8 rounded-lg hidden md:flex",
                                    loopMode !== 'NONE' ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                                )}
                                title={loopMode === 'AYAH' ? "Looping current Ayah" : loopMode === 'SURAH' ? "Looping Surah" : "Loop off"}
                            >
                                {loopMode === 'AYAH' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                            </Button>

                            {/* Speed Control — Horizontal Expansion */}
                            <div className="hidden md:flex items-center group relative h-8">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                                    className={cn(
                                        "h-8 px-1.5 gap-1 rounded-lg transition-colors",
                                        isSpeedOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Playback Speed"
                                >
                                    <Gauge className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">{playbackRate}x</span>
                                </Button>
                                
                                <div className={cn(
                                    "flex items-center gap-1.5 absolute bottom-full mb-3 right-0 bg-background/90 backdrop-blur-md rounded-xl border border-border/50 shadow-2xl z-[110] p-1.5 transition-all duration-300 origin-bottom-right",
                                    isSpeedOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-2 pointer-events-none"
                                )}>
                                    <div className="flex items-center gap-1 px-1">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                        <button
                                            key={rate}
                                            onClick={() => {
                                                setPlaybackRate(rate);
                                                setIsSpeedOpen(false);
                                            }}
                                            className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:bg-primary/20",
                                                playbackRate === rate ? "bg-primary text-primary-foreground scale-105" : "text-muted-foreground"
                                            )}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Volume Control */}
                            <div className="flex items-center">
                                <Popover open={isVolumeOpen} onOpenChange={setIsVolumeOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 transition-colors rounded-lg",
                                                isVolumeOpen ? "text-primary bg-primary/10" : "text-muted-foreground"
                                            )}
                                        >
                                            {volume === 0 ? <VolumeX className="w-4 h-4" /> : 
                                            volume < 0.5 ? <Volume1 className="w-4 h-4" /> : 
                                            <Volume2 className="w-4 h-4" />}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" align="center" className="w-12 p-3 bg-background/95 backdrop-blur-md border-border/50 shadow-2xl rounded-2xl mb-2 z-[110]">
                                        <div className="h-32 flex flex-col items-center">
                                            <Slider.Root
                                                className="relative flex flex-col items-center select-none touch-none w-5 h-full"
                                                value={[volume * 100]}
                                                max={100}
                                                step={1}
                                                orientation="vertical"
                                                onValueChange={(vals) => setVolume(vals[0] / 100)}
                                            >
                                                <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full w-[4px]">
                                                    <Slider.Range className="absolute bg-primary rounded-full w-full bottom-0" />
                                                </Slider.Track>
                                                <Slider.Thumb
                                                    className="block w-3.5 h-3.5 bg-white border-2 border-primary rounded-full hover:scale-110 active:scale-95 transition-all focus:outline-none shadow-lg cursor-pointer"
                                                    aria-label="Volume"
                                                />
                                            </Slider.Root>
                                            <span className="text-[10px] font-bold mt-2 text-primary">{Math.round(volume * 100)}%</span>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                                                        {/* Pop-out — Desktop */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={isPipOpen ? closePip : openPip}
                                className={cn(
                                    "transition-colors h-8 w-8 rounded-lg hidden md:flex",
                                    isPipOpen
                                        ? "text-primary bg-primary/10 ring-1 ring-primary/30"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                )}
                                title={isPipOpen ? "Close floating player" : "Pop out player"}
                            >
                                <PictureInPicture2 className="w-3.5 h-3.5" />
                            </Button>

                            {/* Focus Mode — Desktop */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const nextFocusMode = !isFocusMode;
                                    setFocusMode(nextFocusMode);
                                    
                                    if (nextFocusMode) {
                                        // Entering Focus Mode: Go Fullscreen
                                        const elem = document.documentElement;
                                        if (!document.fullscreenElement) {
                                            elem.requestFullscreen().catch((err) => {
                                                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                                            });
                                        }
                                    } else {
                                        // Exiting Focus Mode: Exit Fullscreen
                                        if (document.fullscreenElement) {
                                            document.exitFullscreen().catch(() => {});
                                        }
                                    }
                                }}
                                className={cn(
                                    "h-8 w-8 transition-colors rounded-lg hidden md:flex",
                                    isFocusMode 
                                        ? "text-primary bg-primary/10 ring-1 ring-primary/30" 
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                )}
                                title="Focus Mode (Peaceful Reading)"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                            </Button>

                            {/* Close */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closePlayer}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            {/* Mobile More Options Menu */}
                            <div className="flex md:hidden items-center ml-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg">
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-56 bg-card border-border shadow-2xl p-1.5 mb-1 z-[110]">
                                        <DropdownMenuItem 
                                            onClick={() => {
                                                if (loopMode === 'NONE') setLoopMode('SURAH');
                                                else if (loopMode === 'SURAH') setLoopMode('AYAH');
                                                else setLoopMode('NONE');
                                            }}
                                            className="gap-3 py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
                                        >
                                            {loopMode === 'AYAH' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">Loop Mode</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Current: {loopMode === 'AYAH' ? 'Ayah' : loopMode === 'SURAH' ? 'Surah' : 'Off'}
                                                </p>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem 
                                            onClick={isPipOpen ? closePip : openPip}
                                            className="gap-3 py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
                                        >
                                            <PictureInPicture2 className="w-4 h-4" />
                                            <div>
                                                <p className="text-sm font-bold">Picture-in-Picture</p>
                                                <p className="text-[10px] text-muted-foreground">Floating video player</p>
                                            </div>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem 
                                            onClick={() => {
                                                const elem = document.documentElement;
                                                if (!document.fullscreenElement) {
                                                    elem.requestFullscreen().catch(e => console.error(e));
                                                    if (!isPipOpen) openPip();
                                                } else {
                                                    if (document.fullscreenElement) {
                                                        document.exitFullscreen().catch(() => {});
                                                    }
                                                    if (isPipOpen) closePip();
                                                }
                                            }}
                                            className="gap-3 py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary"
                                        >
                                            <Maximize2 className={cn("w-4 h-4", (document.fullscreenElement || isPipOpen) && "text-primary")} />
                                            <div>
                                                <p className="text-sm font-bold">Focus Mode</p>
                                                <p className="text-[10px] text-muted-foreground">Fullscreen + Undistractive window</p>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
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
