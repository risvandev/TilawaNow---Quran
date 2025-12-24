import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GlobalAudioPlayer = () => {
    const navigate = useNavigate();
    const {
        currentVerseKey,
        currentSurah,
        isPlaying,
        isLoading,
        togglePlay,
        playNext,
        playPrev,
        closePlayer
    } = useAudioPlayer();

    if (!currentVerseKey || !currentSurah) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[100] animate-in slide-in-from-bottom-full duration-300 md:w-full md:max-w-2xl">
            <div className="bg-background/95 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl p-3 md:p-4 flex items-center justify-between gap-4 ring-1 ring-white/5">

                {/* Track Info - Click to Navigate */}
                <div
                    className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 cursor-pointer group"
                    onClick={() => navigate(`/read/${currentSurah.id}`)}
                >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 text-sm md:text-base ring-1 ring-primary/20 group-hover:bg-primary/20 transition-colors">
                        {currentSurah.id}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm md:text-base truncate leading-tight group-hover:text-primary transition-colors">
                            {currentSurah.name_simple}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">
                                Verse {currentVerseKey.split(':')[1]}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 hidden md:block" />
                            <span className="text-xs text-muted-foreground hidden md:block">
                                {currentSurah.translated_name.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center shrink-0">
                    <Button
                        size="icon"
                        className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
                        onClick={togglePlay}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                        ) : (
                            <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />
                        )}
                    </Button>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center gap-1 md:gap-2 shrink-0 border-l border-border/50 pl-2 md:pl-4 ml-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={closePlayer}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9 w-9 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GlobalAudioPlayer;
